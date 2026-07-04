import { readDocumentFile } from "./storage";

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
