"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartTick, colorSignal } from "../../_components/chart-theme";
import { formatDuration } from "@/lib/format-duration";

type ChartDatum = { page: number; seconds: number };
type Range = "1d" | "7d" | "15d" | "30d" | "all";

const RANGES: { key: Range; label: string }[] = [
  { key: "1d", label: "Bugün" },
  { key: "7d", label: "7 Gün" },
  { key: "15d", label: "15 Gün" },
  { key: "30d", label: "30 Gün" },
  { key: "all", label: "Tüm Zamanlar" },
];

function ChartTooltip({
  active,
  payload,
  documentSlug,
  cachedPages,
}: {
  active?: boolean;
  payload?: { payload: ChartDatum }[];
  documentSlug: string;
  cachedPages: Set<number>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const { page, seconds } = payload[0].payload;
  const url = `/api/documents/${documentSlug}/thumbnail/${page}`;
  return (
    <div className="bg-surface border border-rule rounded-xl shadow-2xl shadow-black/15 p-3 flex gap-3 items-start">
      {cachedPages.has(page) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Sayfa ${page}`}
          className="w-24 h-auto border border-rule-paper rounded bg-paper"
        />
      )}
      <div>
        <p className="font-medium text-ink">Sayfa {page}</p>
        <p className="text-sm text-ink/50">{formatDuration(seconds)} toplam izlenme</p>
      </div>
    </div>
  );
}

export default function PageDurationChart({
  documentId,
  documentSlug,
  pageCount,
}: {
  documentId: string;
  documentSlug: string;
  pageCount: number;
}) {
  const [range, setRange] = useState<Range>("all");
  const [data, setData] = useState<ChartDatum[]>([]);
  const [loading, setLoading] = useState(true);
  const [cachedPages, setCachedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/documents/${documentId}/page-duration?range=${range}`)
      .then((r) => r.json())
      .then((body) => {
        setData(body.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [documentId, range]);

  // Preload page thumbnails into browser cache on mount, update state as each one loads.
  useEffect(() => {
    if (pageCount < 1 || !documentSlug) return;
    for (let p = 1; p <= pageCount; p++) {
      const img = new window.Image();
      const page = p;
      img.onload = () => setCachedPages((prev) => new Set(prev).add(page));
      img.src = `/api/documents/${documentSlug}/thumbnail/${page}`;
    }
  }, [documentSlug, pageCount]);

  const isEmpty = data.every((d) => d.seconds === 0);

  return (
    <div>
      <div className="flex gap-1 mb-5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setRange(r.key)}
            className={`px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
              range === r.key
                ? "bg-signal text-white"
                : "text-ink/50 hover:text-ink hover:bg-surface-muted"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-ink/30 font-mono text-sm animate-pulse">Yükleniyor…</p>
        </div>
      ) : isEmpty ? (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-ink/40 text-sm">Bu aralıkta görüntüleme verisi yok.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
            <XAxis dataKey="page" tickFormatter={(p) => `Sayfa ${p}`} fontSize={12} tick={chartTick} />
            <YAxis
              fontSize={12}
              tick={chartTick}
              tickFormatter={(v) => formatDuration(v, "short")}
              width={48}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  payload={props.payload as unknown as { payload: ChartDatum }[] | undefined}
                  documentSlug={documentSlug}
                  cachedPages={cachedPages}
                />
              )}
              cursor={{ fill: "rgba(32,35,43,0.04)" }}
            />
            <Bar dataKey="seconds" fill={colorSignal} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
