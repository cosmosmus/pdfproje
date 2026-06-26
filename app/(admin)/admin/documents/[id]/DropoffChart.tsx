"use client";

import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartGrid, chartTick, colorEmber } from "../../_components/chart-theme";

type Datum = { page: number; percent: number; visitCount: number };

function DropoffTooltip({ active, payload }: { active?: boolean; payload?: { payload: Datum }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const { page, percent, visitCount } = payload[0].payload;
  return (
    <div className="bg-surface border border-rule rounded-xl shadow-2xl shadow-black/15 p-3">
      <p className="font-medium text-ink">Sayfa {page}</p>
      <p className="text-sm text-ink/50">
        %{percent} ulaştı ({visitCount} ziyaret)
      </p>
    </div>
  );
}

export default function DropoffChart({ data }: { data: Datum[] }) {
  if (data.length === 0) {
    return <p className="text-ink/40 text-sm">Henüz ziyaret verisi yok.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGrid} />
        <XAxis dataKey="page" tickFormatter={(p) => `Sayfa ${p}`} fontSize={12} tick={chartTick} />
        <YAxis
          fontSize={12}
          tick={chartTick}
          domain={[0, 100]}
          tickFormatter={(v) => `%${v}`}
          label={{ value: "%", angle: -90, position: "insideLeft", fill: "#6B6F7B" }}
        />
        <Tooltip content={<DropoffTooltip />} />
        <Line
          type="monotone"
          dataKey="percent"
          stroke={colorEmber}
          strokeWidth={2}
          dot={{ r: 3, fill: colorEmber }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
