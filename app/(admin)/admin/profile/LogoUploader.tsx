"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoUploader({ hasLogo }: { hasLogo: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(
    hasLogo ? "/api/branding/logo" : null
  );
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/branding/logo", { method: "POST", body: formData });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Yüklenemedi");
      return;
    }

    setStatus("idle");
    setPreview(`/api/branding/logo?t=${Date.now()}`);
    router.refresh();
  }

  async function handleRemove() {
    setStatus("uploading");
    await fetch("/api/admin/branding/logo", { method: "DELETE" });
    setStatus("idle");
    setPreview(null);
    router.refresh();
  }

  return (
    <div className="bg-surface border border-rule rounded-2xl p-6">
      <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/60 mb-3">
        Logo
      </label>
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-lg border border-rule bg-shell flex items-center justify-center overflow-hidden shrink-0">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="font-display font-extrabold text-lg text-ink/30">V</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={status === "uploading"}
              className="font-mono text-xs uppercase tracking-wide border border-rule rounded px-3 py-1.5 text-ink/70 hover:border-signal hover:text-signal hover:bg-surface-muted transition-colors disabled:opacity-50"
            >
              {status === "uploading" ? "Yükleniyor..." : "Görsel Yükle"}
            </button>
            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={status === "uploading"}
                className="font-mono text-xs uppercase tracking-wide border border-rule rounded px-3 py-1.5 text-danger hover:bg-surface-muted transition-colors disabled:opacity-50"
              >
                Kaldır
              </button>
            )}
          </div>
          <p className="text-xs text-ink/40">PNG, JPEG, WEBP veya SVG · max 2MB</p>
          {error && <p className="text-danger text-xs">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
