export function thumbnailKey(documentId: string, pageNumber: number): string {
  return `thumbnails/${documentId}/${pageNumber}.png`;
}
