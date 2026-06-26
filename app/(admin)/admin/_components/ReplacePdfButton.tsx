"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { IconRefresh } from "./icons";

export default function ReplacePdfButton({ documentId }: { documentId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`/api/admin/documents/${documentId}/replace`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Güncellenemedi");
      return;
    }

    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={status === "uploading"}
        title="Katalog PDF'ini güncelle (link aynı kalır)"
        className="flex items-center justify-center w-7 h-7 border border-ember/30 bg-ember/10 rounded text-ember-dim hover:border-ember hover:bg-ember/20 transition-colors disabled:opacity-50"
      >
        <IconRefresh className={`w-3.5 h-3.5 ${status === "uploading" ? "animate-spin" : ""}`} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      {error && (
        <p className="absolute top-full left-0 mt-1 text-danger text-xs whitespace-nowrap bg-surface border border-rule rounded px-2 py-1 shadow-xl shadow-black/10">
          {error}
        </p>
      )}
    </div>
  );
}
