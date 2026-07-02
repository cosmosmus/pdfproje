"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartTick, chartTooltipStyle, colorSignal } from "./chart-theme";

type Datum = { title: string; seconds: number };

export default function TopDocumentsChart({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <p className="text-ink/40 text-sm">Henüz veri yok.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(160, data.length * 44)}>
      <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGrid} />
        <XAxis type="number" fontSize={12} tick={chartTick} />
        <YAxis type="category" dataKey="title" fontSize={12} width={160} tick={chartTick} />
        <Tooltip
          formatter={(value) => [`${value} sn`, "Süre"]}
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "rgba(32,35,43,0.04)" }}
        />
        <Bar dataKey="seconds" fill={colorSignal} radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
