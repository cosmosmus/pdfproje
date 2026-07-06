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
  // Lazy import: pdf-to-img pulls in pdfjs + native canvas, and a failure
  // there (e.g. missing platform binary) must not take the upload route down
  // with it — it should only surface here, inside the after() catch.
  console.log("Thumbnail generation starting", documentId, `v${version}`);
  const { pdf } = await import("pdf-to-img");
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
    console.log("Thumbnail generation finished", documentId, `v${version}`, pageNumber, "pages");
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

/// readThumbnail with an on-demand fallback: if the pre-rendered PNG is
/// missing (background generation interrupted or still running), render just
/// that page from the stored PDF and cache it. Only possible for the current
/// version — storage holds only the latest PDF, so past versions stay 404.
export async function readOrGenerateThumbnail(
  documentId: string,
  version: number,
  pageNumber: number,
  opts: { storageKey: string; isCurrentVersion: boolean; pageCount: number }
): Promise<Buffer> {
  try {
    return await readThumbnail(documentId, version, pageNumber);
  } catch (err) {
    if (!opts.isCurrentVersion || pageNumber > opts.pageCount) throw err;
    const pdfBuffer = await readDocumentFile(opts.storageKey);
    const { pdf } = await import("pdf-to-img");
    const doc = await pdf(pdfBuffer, { scale: THUMBNAIL_SCALE });
    try {
      const png = await doc.getPage(pageNumber);
      await saveDocumentFile(thumbnailKey(documentId, version, pageNumber), png, "image/png");
      return png;
    } finally {
      await doc.destroy();
    }
  }
}
