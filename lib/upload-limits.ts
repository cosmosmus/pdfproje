// Complete adımında PDF sayfa sayısı için sunucu belleğine okunuyor;
// serverless bellek sınırları nedeniyle üst sınır tutuyoruz.
export const MAX_PDF_SIZE_BYTES = 200 * 1024 * 1024;
export const MAX_PDF_SIZE_LABEL = "200MB";
