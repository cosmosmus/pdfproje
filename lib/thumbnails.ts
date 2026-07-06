import { pdf } from "pdf-to-img";
import { readDocumentFile, saveDocumentFile } from "./storage";

// Hover previews render small; ~400px wide is plenty even on retina.
// scale multiplies the PDF's 72dpi size (A4 ≈ 595pt wide → 0.67 ≈ 400px).
const THUMBNAIL_SCALE = 0.67;
const SAVE_CONCURRENCY = 4;

/// Renders every page to a PNG and saves it under thumbnails/{id}/v{n}/.
/// Rendering is serial (pdf-to-img yields pages one at a time) but storage
/// writes overlap with bounded concurrency. Per-page failures are logged,
/// not fatal — a missing page just means no hover preview.
export async function generateThumbnails(
  documentId: string,
  version: number,
  buffer: Buffer
): Promise<void> {
  const doc = await pdf(buffer, { scale: THUMBNAIL_SCALE });
  const inFlight = new Set<Promise<void>>();
  let pageNumber = 0;
  try {
    for await (const pageBuffer of doc) {
      pageNumber += 1;
      const key = thumbnailKey(documentId, version, pageNumber);
      const task: Promise<void> = saveDocumentFile(key, pageBuffer, "image/png")
        .catch((err) => console.error("Thumbnail save failed", key, err))
        .finally(() => inFlight.delete(task));
      inFlight.add(task);
      if (inFlight.size >= SAVE_CONCURRENCY) await Promise.race(inFlight);
    }
    await Promise.all(inFlight);
  } finally {
    await doc.destroy();
  }
}

export function thumbnailKey(documentId: string, version: number, pageNumber: number): string {
  return `thumbnails/${documentId}/v${version}/${pageNumber}.png`;
}

/// Documents uploaded before PDF versioning stored their (v1) thumbnails without
/// the version segment; keep reading them from the old location.
function legacyThumbnailKey(documentId: string, pageNumber: number): string {
  return `thumbnails/${documentId}/${pageNumber}.png`;
}

export async function readThumbnail(
  documentId: string,
  version: number,
  pageNumber: number
): Promise<Buffer> {
  try {
    return await readDocumentFile(thumbnailKey(documentId, version, pageNumber));
  } catch (err) {
    if (version === 1) {
      return readDocumentFile(legacyThumbnailKey(documentId, pageNumber));
    }
    throw err;
  }
}
