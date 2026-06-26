import { IconEye, IconUsers, IconClock, IconHourglass } from "./icons";
import { formatDuration } from "@/lib/format-duration";

export default function StatsCards({
  totalVisits,
  uniqueViewers,
  avgVisitSeconds,
  totalSeconds,
}: {
  totalVisits: number;
  uniqueViewers: number;
  avgVisitSeconds: number;
  totalSeconds: number;
}) {
  const cards = [
    { label: "Toplam Ziyaret", value: totalVisits, live: true, Icon: IconEye },
    { label: "Tekil Görüntüleyen", value: uniqueViewers, live: false, Icon: IconUsers },
    { label: "Ortalama Ziyaret Süresi", value: formatDuration(avgVisitSeconds), live: false, Icon: IconClock },
    { label: "Toplam İzlenme Süresi", value: formatDuration(totalSeconds), live: false, Icon: IconHourglass },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="hover-lift bg-surface border border-rule rounded-2xl p-5 relative overflow-hidden cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <c.Icon className="w-5 h-5 text-signal" />
            {c.live && <span className="pulse-dot" title="Canlı" />}
          </div>
          <p className="font-display font-bold text-3xl mb-1">{c.value}</p>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40">
            {c.label}
          </p>
        </div>
      ))}
    </div>
  );
}
