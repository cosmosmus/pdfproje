"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { countryFlagUrl } from "@/lib/country-flag";
import { IconEye } from "./icons";

const POLL_INTERVAL_MS = 15_000;

type LiveViewer = {
  visitId: string;
  email: string;
  documentId: string;
  documentTitle: string;
  currentPage: number | null;
  country: string | null;
  startedAt: string;
};

function elapsedLabel(startedAt: string): string {
  const minutes = Math.floor((Date.now() - new Date(startedAt).getTime()) / 60_000);
  if (minutes < 1) return "az önce girdi";
  return `${minutes} dk'dır içeride`;
}

export default function LiveVisitors() {
  const [viewers, setViewers] = useState<LiveViewer[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/admin/live");
        if (!res.ok) return;
        const data = (await res.json()) as { viewers: LiveViewer[] };
        if (!cancelled) setViewers(data.viewers);
      } catch {
        // Ağ hatasında mevcut listeyi koru; bir sonraki poll dener.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const count = viewers?.length ?? 0;

  return (
    <section className="bg-surface rounded-[28px] p-6 md:p-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="relative flex items-center justify-center w-9 h-9 rounded-full bg-ink text-surface shrink-0">
            <IconEye className="w-4.5 h-4.5" />
            {count > 0 && <span className="pulse-dot absolute -top-0.5 -right-0.5" title="Canlı" />}
          </span>
          <h2 className="font-display font-extrabold text-xl tracking-tight text-ink">
            Şu Anda İzleyenler
          </h2>
        </div>
        <span
          className={`rounded-full text-xs font-semibold px-3 py-1 ${
            count > 0 ? "bg-signal/10 text-signal" : "bg-surface-muted text-ink/45"
          }`}
        >
          {viewers === null ? "…" : count > 0 ? `${count} canlı izleyici` : "Canlı izleyici yok"}
        </span>
      </div>

      {viewers === null ? (
        <div className="mt-4 h-12 animate-pulse bg-surface-muted rounded-xl" />
      ) : count === 0 ? (
        <p className="text-sm text-ink/45 mt-3">
          Şu anda kimse döküman görüntülemiyor. Biri kataloğunu açtığında burada canlı olarak
          görünecek.
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1.5">
          {viewers.map((v) => (
            <li
              key={v.visitId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-shell/60 px-4 py-3"
            >
              <span className="pulse-dot shrink-0" title="Canlı" />
              <span className="font-semibold text-sm break-all">{v.email}</span>
              <Link
                href={`/admin/documents/${v.documentId}`}
                className="text-sm text-signal hover:text-signal/80 transition-colors font-medium"
              >
                {v.documentTitle}
              </Link>
              {v.currentPage !== null && (
                <span className="font-mono text-xs text-ember whitespace-nowrap">
                  {v.currentPage}. sayfada
                </span>
              )}
              <span className="text-xs text-ink/45 whitespace-nowrap ml-auto flex items-center gap-1">
                {countryFlagUrl(v.country) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={countryFlagUrl(v.country)!}
                    alt=""
                    className="w-4 h-3 rounded-[2px] object-cover shrink-0"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                {elapsedLabel(v.startedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
