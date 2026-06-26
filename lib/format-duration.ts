/**
 * Seconds → okunabilir süre. "45 sn", "2 dk 30 sn", "1 sa 20 dk", "2 gün 3 sa"
 * Axis modu: daha kısa etiketler ("45sn", "2dk", "1sa", "2g")
 */
export function formatDuration(seconds: number, mode: "full" | "short" = "full"): string {
  if (!isFinite(seconds) || seconds < 0) return "—";
  seconds = Math.round(seconds);

  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (mode === "short") {
    if (d > 0) return `${d}g${h > 0 ? ` ${h}sa` : ""}`;
    if (h > 0) return `${h}sa${m > 0 ? ` ${m}dk` : ""}`;
    if (m > 0) return `${m}dk`;
    return `${s}sn`;
  }

  // full mode
  if (d > 0) return `${d} gün${h > 0 ? ` ${h} sa` : ""}`;
  if (h > 0) return `${h} sa${m > 0 ? ` ${m} dk` : ""}`;
  if (m > 0) return `${m} dk${s > 0 ? ` ${s} sn` : ""}`;
  return `${s} sn`;
}
