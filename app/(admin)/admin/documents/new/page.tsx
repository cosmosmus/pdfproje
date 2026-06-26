"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumbs from "../../_components/Breadcrumbs";
import { IconUpload, IconPdfFile } from "../../_components/icons";

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Tarayıcının PDF'i kendi açmasını global düzeyde engelle */
  useEffect(() => {
    function prevent(e: DragEvent) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      if (!title) setTitle(dropped.name.replace(/\.pdf$/i, ""));
    } else {
      setError("Yalnızca PDF dosyası yüklenebilir.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("PDF dosyası seçin"); return; }
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Yükleme başarısız oldu");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-md">
      <Breadcrumbs items={[{ label: "Genel Bakış", href: "/admin" }, { label: "Yeni PDF Yükle" }]} />
      <div className="bg-surface border border-rule rounded-2xl p-8">
        <h1 className="font-display font-extrabold text-2xl mb-6">Yeni katalog ekle</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full bg-shell border border-rule rounded-lg px-4 py-2.5 placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />

          {/* Drag-and-drop + tıklama alanı */}
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
            {!file && <p className="text-xs text-ink/30">Yalnızca .pdf</p>}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !title) setTitle(f.name.replace(/\.pdf$/i, ""));
              }}
              className="hidden"
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-signal text-white font-bold rounded-lg px-3 py-3 hover:bg-signal-dim transition-colors disabled:opacity-50"
          >
            <IconUpload className="w-4 h-4" />
            {loading ? "Yükleniyor..." : "Yükle"}
          </button>
        </form>
      </div>
    </div>
  );
}
