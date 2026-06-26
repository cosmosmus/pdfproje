"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartTick, colorEmber } from "../../../../_components/chart-theme";
import { formatDuration } from "@/lib/format-duration";

type ChartDatum = { page: number; seconds: number };

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

export default function ViewerPageChart({
  documentSlug,
  pageCount,
  data,
}: {
  documentSlug: string;
  pageCount: number;
  data: ChartDatum[];
}) {
  const [cachedPages, setCachedPages] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (pageCount < 1 || !documentSlug) return;
    for (let p = 1; p <= pageCount; p++) {
      const img = new window.Image();
      const page = p;
      img.onload = () => setCachedPages((prev) => new Set(prev).add(page));
      img.src = `/api/documents/${documentSlug}/thumbnail/${page}`;
    }
  }, [documentSlug, pageCount]);

  if (data.every((d) => d.seconds === 0)) {
    return (
      <div className="h-[240px] flex items-center justify-center">
        <p className="text-ink/40 text-sm">Henüz görüntüleme verisi yok.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
        <XAxis dataKey="page" tickFormatter={(p) => `S.${p}`} fontSize={11} tick={chartTick} />
        <YAxis
          fontSize={11}
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
        <Bar dataKey="seconds" fill={colorEmber} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
