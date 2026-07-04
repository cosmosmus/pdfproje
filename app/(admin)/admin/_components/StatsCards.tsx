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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={
            c.live
              ? "rounded-[24px] bg-ink text-surface px-4 pt-6 pb-5 flex flex-col items-center text-center gap-3"
              : "hover-lift rounded-[24px] bg-surface px-4 pt-6 pb-5 flex flex-col items-center text-center gap-3 cursor-default"
          }
        >
          <span
            className={
              c.live
                ? "relative flex items-center justify-center w-11 h-11 rounded-full bg-surface text-ink"
                : "flex items-center justify-center w-11 h-11 rounded-full bg-surface-muted text-ink/70"
            }
          >
            <c.Icon className="w-5 h-5" />
          </span>
          <div>
            <p className="font-display font-extrabold text-2xl leading-none">{c.value}</p>
            <p className={c.live ? "text-xs mt-1.5 text-surface/60" : "text-xs mt-1.5 text-ink/45"}>
              {c.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
