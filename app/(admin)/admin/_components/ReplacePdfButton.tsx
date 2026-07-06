"use client";

import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IconPdfFile, IconRefresh } from "./icons";
import { StageRow, formatBytes } from "./UploadStages";

type Stage = "confirm" | "uploading" | "processing" | "done" | "error";

// Sunucudaki limitle aynı tutulmalı (app/api/admin/documents/[id]/replace/route.ts)
const MAX_PDF_SIZE_BYTES = 256 * 1024 * 1024;

export default function ReplacePdfButton({
  documentId,
  documentTitle,
}: {
  documentId: string;
  documentTitle: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>("confirm");
  const [uploadPct, setUploadPct] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ pageCount: number; version?: number } | null>(null);

  const busy = stage === "uploading" || stage === "processing";
  const tooLarge = file !== null && file.size > MAX_PDF_SIZE_BYTES;

  // Yükleme sürerken sekme kapatma/yenileme uyarısı — yarım kalan güncelleme
  // sunucuda eski thumbnail'larla yeni PDF'in karışmasına yol açabilir.
  useEffect(() => {
    if (!busy) return;
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault();
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  useEffect(() => {
    if (!file || busy) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, busy]);

  function closeModal() {
    setFile(null);
    setStage("confirm");
    setUploadPct(0);
    setError(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStage("confirm");
    setError(null);
  }

  function startUpload() {
    if (!file) return;
    setStage("uploading");
    setUploadPct(0);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

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
      // Platform error pages (e.g. Vercel 500) return HTML, not JSON.
      let body: { error?: string; pageCount?: number; version?: number } = {};
      try { body = JSON.parse(xhr.responseText || "{}"); } catch {}
      if (xhr.status >= 200 && xhr.status < 300) {
        setResult({ pageCount: body.pageCount ?? 0, version: body.version });
        setStage("done");
        router.refresh();
      } else {
        setError(body.error ?? `Güncelleme başarısız oldu (HTTP ${xhr.status})`);
        setStage("error");
      }
    });

    xhr.addEventListener("error", () => {
      setError("Ağ hatası oluştu, tekrar deneyin.");
      setStage("error");
    });

    xhr.open("POST", `/api/admin/documents/${documentId}/replace`);
    xhr.send(formData);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        title="Katalog PDF'ini güncelle (link aynı kalır)"
        className="flex items-center justify-center w-7 h-7 border border-ember/30 bg-ember/10 rounded-full text-ember-dim hover:border-ember hover:bg-ember/20 transition-colors"
      >
        <IconRefresh className="w-3.5 h-3.5" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      {file &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
              onClick={busy ? undefined : closeModal}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="PDF güncelle"
              className="relative bg-surface rounded-[28px] p-6 sm:p-8 w-full max-w-md shadow-2xl shadow-black/25"
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ember-dim mb-1">
                PDF Güncelle
              </p>
              <h2 className="font-display font-extrabold text-xl tracking-tight mb-5 break-words">
                {documentTitle}
              </h2>

              <div className="flex items-center gap-3 bg-shell border border-rule rounded-xl px-4 py-3 mb-5">
                <IconPdfFile className="w-5 h-5 text-ember-dim shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="font-mono text-xs text-ink/40">{formatBytes(file.size)}</p>
                </div>
              </div>

              {stage === "confirm" && (
                <div className="flex flex-col gap-5">
                  {tooLarge ? (
                    <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                      Bu dosya {formatBytes(file.size)} — PDF 256MB&apos;tan küçük olmalı.
                      Daha küçük bir dosya seçin.
                    </p>
                  ) : (
                    <p className="text-sm text-ink/60 leading-relaxed">
                      Yeni PDF mevcut dosyanın yerine geçer, paylaşım linki aynı kalır.
                      Bugüne kadarki istatistikler eski versiyonda arşivlenir ve istatistik
                      sayfasındaki versiyon seçicisinden izlenmeye devam eder.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startUpload}
                      disabled={tooLarge}
                      className="flex-1 bg-ink text-surface font-semibold rounded-full px-4 py-2.5 hover:bg-ink-soft transition-colors disabled:opacity-40 disabled:pointer-events-none"
                    >
                      PDF&apos;i güncelle
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 rounded-full text-ink/50 hover:text-ink hover:bg-surface-muted font-medium transition-colors"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}

              {busy && (
                <div className="flex flex-col gap-5">
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
                      {stage === "uploading" ? `${uploadPct}%` : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <StageRow
                      done={stage === "processing"}
                      active={stage === "uploading"}
                      label="PDF sunucuya yükleniyor"
                      detail={stage === "uploading" ? `${uploadPct}%` : undefined}
                    />
                    <StageRow
                      done={false}
                      active={stage === "processing"}
                      label="PDF kaydediliyor"
                    />
                    <StageRow done={false} active={false} label="Tamamlandı" />
                  </div>

                  <p className="text-xs text-ink/40 text-center">
                    {stage === "processing"
                      ? "Sayfa önizlemeleri arka planda oluşturulur, birazdan istatistik sayfasında görünür."
                      : "Yükleme bitene kadar pencereyi kapatmayın."}
                  </p>
                </div>
              )}

              {stage === "done" && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center gap-3 bg-signal/10 border border-signal/30 rounded-xl px-4 py-3">
                    <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5 text-signal shrink-0">
                      <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-ink">Katalog güncellendi</p>
                      <p className="font-mono text-xs text-ink/50">
                        {result?.pageCount} sayfa
                        {result?.version ? ` · v${result.version} olarak kaydedildi` : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="w-full bg-ink text-surface font-semibold rounded-full px-4 py-2.5 hover:bg-ink-soft transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              )}

              {stage === "error" && (
                <div className="flex flex-col gap-5">
                  <p className="text-sm text-danger bg-danger/5 border border-danger/20 rounded-xl px-4 py-3">
                    {error}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={startUpload}
                      className="flex-1 bg-ink text-surface font-semibold rounded-full px-4 py-2.5 hover:bg-ink-soft transition-colors"
                    >
                      Tekrar dene
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2.5 rounded-full text-ink/50 hover:text-ink hover:bg-surface-muted font-medium transition-colors"
                    >
                      Vazgeç
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
