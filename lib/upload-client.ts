// Tarayıcı tarafı yükleme yardımcıları. Öncelik: presigned URL ile doğrudan
// R2'ye PUT (Vercel'in 4.5MB istek limitine takılmaz); depolama yerel disk
// modundaysa (presign yok) klasik sunucu-üzerinden multipart yola düşer.

type Progress = (pct: number) => void;

interface UploadResult {
  ok: boolean;
  status: number;
  body: Record<string, unknown>;
}

function xhrSend(
  method: string,
  url: string,
  payload: File | FormData,
  onProgress: Progress,
  contentType?: string
): Promise<{ status: number; responseText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
    });
    xhr.addEventListener("load", () => resolve({ status: xhr.status, responseText: xhr.responseText }));
    xhr.addEventListener("error", () => reject(new Error("network")));
    xhr.open(method, url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(payload);
  });
}

function parseJson(text: string): Record<string, unknown> {
  try { return JSON.parse(text || "{}"); } catch { return {}; }
}

async function postJson(url: string, payload: unknown): Promise<UploadResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return { ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) };
}

/** Yeni katalog yükler. Dönen body: { id, slug } veya { error }. */
export async function uploadNewPdf(opts: {
  file: File;
  title: string;
  slug?: string;
  onProgress: Progress;
  onPhase: (phase: "uploading" | "processing") => void;
}): Promise<UploadResult> {
  const { file, title, slug, onProgress, onPhase } = opts;
  onPhase("uploading");

  const presign = await postJson("/api/upload/presign", { size: file.size, slug: slug || undefined });
  if (!presign.ok) return presign;

  if (presign.body.direct) {
    const put = await xhrSend("PUT", String(presign.body.uploadUrl), file, onProgress, "application/pdf");
    if (put.status < 200 || put.status >= 300) {
      return { ok: false, status: put.status, body: { error: "Dosya depolamaya yüklenemedi, tekrar deneyin" } };
    }
    onPhase("processing");
    return postJson("/api/upload/complete", {
      slug: presign.body.slug,
      title,
      originalFilename: file.name,
    });
  }

  // Yerel disk modu: klasik multipart yükleme.
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  if (slug) formData.append("slug", slug);
  const res = await xhrSend("POST", "/api/upload", formData, (pct) => {
    onProgress(pct);
    if (pct >= 100) onPhase("processing");
  });
  return { ok: res.status >= 200 && res.status < 300, status: res.status, body: parseJson(res.responseText) };
}

/** Mevcut kataloğun PDF'ini değiştirir. Dönen body: { pageCount, version } veya { error }. */
export async function replacePdf(opts: {
  documentId: string;
  file: File;
  onProgress: Progress;
  onPhase: (phase: "uploading" | "processing") => void;
}): Promise<UploadResult> {
  const { documentId, file, onProgress, onPhase } = opts;
  onPhase("uploading");

  const presign = await postJson(`/api/admin/documents/${documentId}/replace/presign`, { size: file.size });
  if (!presign.ok) return presign;

  if (presign.body.direct) {
    const put = await xhrSend("PUT", String(presign.body.uploadUrl), file, onProgress, "application/pdf");
    if (put.status < 200 || put.status >= 300) {
      return { ok: false, status: put.status, body: { error: "Dosya depolamaya yüklenemedi, tekrar deneyin" } };
    }
    onPhase("processing");
    return postJson(`/api/admin/documents/${documentId}/replace/complete`, {
      originalFilename: file.name,
    });
  }

  const formData = new FormData();
  formData.append("file", file);
  const res = await xhrSend("POST", `/api/admin/documents/${documentId}/replace`, formData, (pct) => {
    onProgress(pct);
    if (pct >= 100) onPhase("processing");
  });
  return { ok: res.status >= 200 && res.status < 300, status: res.status, body: parseJson(res.responseText) };
}
