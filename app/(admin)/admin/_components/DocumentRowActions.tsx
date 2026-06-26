"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DocumentRowActions({
  documentId,
  isActive,
}: {
  documentId: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [active, setActive] = useState(isActive);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    const res = await fetch(`/api/admin/documents/${documentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !active }),
    });
    setToggling(false);
    if (res.ok) {
      setActive((v) => !v);
      router.refresh();
    }
  }

  async function handleDelete() {
    if (!confirm("Bu dökümanı silmek istediğine emin misin? Tüm istatistikler de silinecek.")) return;
    setDeleting(true);
    await fetch(`/api/admin/documents/${documentId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggling}
        title={active ? "Pasif yap (linki devre dışı bırakır)" : "Aktif et"}
        className={`p-1.5 rounded transition-colors disabled:opacity-40 ${
          active
            ? "text-signal hover:bg-surface-muted hover:text-signal-dim"
            : "text-ink/30 hover:bg-surface-muted hover:text-signal"
        }`}
      >
        {active ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        )}
      </button>

      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title="Dökümanı sil"
        className="p-1.5 rounded text-ink/30 hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-40"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}
