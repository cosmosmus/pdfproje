"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../../_components/Breadcrumbs";
import { IconUpload, IconPdfFile } from "../../_components/icons";

type Stage = "idle" | "uploading" | "processing" | "done";

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Yazarken: sadece geçersiz karakterleri temizle, trailing dash'e dokunma */
function slugifyLive(value: string) {
  return value
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-");
}

/* Göndermeden önce: başındaki/sonundaki tireleri de temizle */
function slugifyFinal(value: string) {
  return slugifyLive(value).replace(/^-+|-+$/g, "");
}

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [uploadPct, setUploadPct] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function prevent(e: DragEvent) { e.preventDefault(); e.stopPropagation(); }
    window.addEventListener("dragover", prevent);
    window.addEventListener("drop", prevent);
    return () => {
      window.removeEventListener("dragover", prevent);
      window.removeEventListener("drop", prevent);
    };
  }, []);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === "application/pdf") {
      setFile(dropped);
      if (!title) {
        const name = dropped.name.replace(/\.pdf$/i, "");
        setTitle(name);
        if (!slugTouched) setSlug(slugifyLive(name));
      }
    } else {
      setError("Yalnızca PDF dosyası yüklenebilir.");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("PDF dosyası seçin"); return; }
    setError(null);
    setStage("uploading");
    setUploadPct(0);

    const finalSlug = slugifyFinal(slug);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    if (finalSlug) formData.append("slug", finalSlug);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (ev) => {
      if (ev.lengthComputable) {
        setUploadPct(Math.round((ev.loaded / ev.total) * 100));
      }
    });

    xhr.upload.addEventListener("load", () => {
      setUploadPct(100);
      setStage("processing");
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setStage("done");
        router.push("/admin");
        router.refresh();
      } else {
        const body = JSON.parse(xhr.responseText || "{}");
        setError(body.error ?? "Yükleme başarısız oldu");
        setStage("idle");
      }
    });

    xhr.addEventListener("error", () => {
      setError("Ağ hatası oluştu, tekrar deneyin.");
      setStage("idle");
    });

    xhr.open("POST", "/api/upload");
    xhr.send(formData);
  }

  const isLoading = stage !== "idle";
  const displaySlug = slugifyFinal(slug);

  return (
    <div className="max-w-md">
      <Breadcrumbs items={[{ label: "Panel", href: "/admin" }, { label: "Yeni PDF Yükle" }]} />
      <div className="bg-surface rounded-[28px] p-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-6">Yeni katalog ekle</h1>

        {/* ── LOADING SCREEN ── */}
        {isLoading && (
          <div className="flex flex-col gap-5">
            {/* Dosya bilgisi */}
            <div className="flex items-center gap-3 bg-shell border border-rule rounded-xl px-4 py-3">
              <IconPdfFile className="w-5 h-5 text-ember-dim shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file?.name}</p>
                <p className="font-mono text-xs text-ink/40">{file ? formatBytes(file.size) : ""}</p>
              </div>
            </div>

            {/* Progress bar + yüzde */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-rule rounded-full overflow-hidden">
                {stage === "processing" ? (
                  <div className="h-full bg-signal rounded-full animate-pulse" style={{ width: "100%" }} />
                ) : (
                  <div
                    className="h-full bg-signal rounded-full transition-all duration-200"
                    style={{ width: `${uploadPct}%` }}
                  />
                )}
              </div>
              <span className="font-mono text-base font-bold text-signal tabular-nums w-12 text-right shrink-0">
                {stage === "uploading" ? `${uploadPct}%` : stage === "done" ? "100%" : "—"}
              </span>
            </div>

            {/* Aşama listesi */}
            <div className="flex flex-col gap-2.5">
              <StageRow
                done={stage === "processing" || stage === "done"}
                active={stage === "uploading"}
                label="PDF sunucuya yükleniyor"
                detail={stage === "uploading" ? `${uploadPct}%` : undefined}
              />
              <StageRow
                done={stage === "done"}
                active={stage === "processing"}
                label="Tüm sayfalar istatistikler için render ediliyor"
              />
              <StageRow
                done={false}
                active={stage === "done"}
                label="Tamamlandı, yönlendiriliyor"
              />
            </div>

            {stage === "processing" && (
              <p className="text-xs text-ink/40 text-center">
                Sayfa sayısına göre bu 10–60 saniye sürebilir.
              </p>
            )}
          </div>
        )}

        {/* ── FORM ── */}
        {!isLoading && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Başlık"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugifyLive(e.target.value));
              }}
              required
              className="w-full bg-shell border border-rule rounded-xl px-4 py-2.5 placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
            />

            <div>
              <input
                type="text"
                placeholder="link-slug (boş bırakılırsa otomatik üretilir)"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(slugifyLive(e.target.value));
                }}
                onBlur={() => setSlug(slugifyFinal(slug))}
                className="w-full bg-shell border border-rule rounded-xl px-4 py-2.5 placeholder:text-ink/30 focus:border-signal outline-none transition-colors font-mono text-sm"
              />
              {displaySlug && (
                <p className="text-xs text-ink/40 mt-1 ml-1">
                  Link: <span className="font-mono text-signal">/d/{displaySlug}</span>
                </p>
              )}
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors select-none ${
                dragging
                  ? "border-signal bg-signal/5 text-signal"
                  : "border-rule text-ink/40 hover:border-signal hover:text-signal hover:bg-surface-muted"
              }`}
            >
              <IconPdfFile className="w-7 h-7" />
              <p className="text-sm font-medium">
                {file ? file.name : "PDF sürükle veya tıkla"}
              </p>
              {file ? (
                <p className="font-mono text-xs text-ink/40">{formatBytes(file.size)}</p>
              ) : (
                <p className="text-xs text-ink/30">Yalnızca .pdf</p>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  if (f && !title) {
                    const name = f.name.replace(/\.pdf$/i, "");
                    setTitle(name);
                    if (!slugTouched) setSlug(slugifyLive(name));
                  }
                }}
                className="hidden"
              />
            </div>

            {error && <p className="text-danger text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-ink text-surface font-semibold rounded-full px-3 py-3 hover:bg-ink-soft transition-colors"
            >
              <IconUpload className="w-4 h-4" />
              Yükle
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function StageRow({
  done,
  active,
  label,
  detail,
}: {
  done: boolean;
  active: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 h-5 shrink-0 flex items-center justify-center">
        {done ? (
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-signal">
            <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : active ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-signal border-t-transparent animate-spin block" />
        ) : (
          <span className="w-3 h-3 rounded-full border border-rule block mx-auto" />
        )}
      </span>
      <span className={`text-sm flex-1 ${active ? "text-ink font-medium" : done ? "text-ink/40 line-through decoration-1" : "text-ink/30"}`}>
        {label}
      </span>
      {detail && <span className="font-mono text-xs text-signal">{detail}</span>}
    </div>
  );
}
