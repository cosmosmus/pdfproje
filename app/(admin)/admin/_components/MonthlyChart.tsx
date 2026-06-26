"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartTick, chartTooltipStyle, colorSignal } from "./chart-theme";

type Datum = { month: string; visits: number; seconds: number };

export default function MonthlyChart({ data }: { data: Datum[] }) {
  if (data.every((d) => d.visits === 0)) {
    return <p className="text-ink/40 text-sm">Henüz aylık veri yok.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
        <XAxis dataKey="month" fontSize={12} tick={chartTick} />
        <YAxis fontSize={12} tick={chartTick} />
        <Tooltip
          formatter={(value) => [`${value} ziyaret`, "Ziyaret"]}
          contentStyle={chartTooltipStyle}
          cursor={{ fill: "rgba(32,35,43,0.04)" }}
        />
        <Bar dataKey="visits" fill={colorSignal} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
