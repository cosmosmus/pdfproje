/**
 * Tüm tarih/saat gösterimleri İstanbul saatine sabitlenir. Sunucu bileşenleri
 * Vercel'de UTC ile render edildiğinden, saat dilimi verilmeyen
 * toLocaleString çağrıları 3 saat geride görünüyordu.
 */
const TIME_ZONE = "Europe/Istanbul";

/** 13.07.2026 14:05:32 */
export function formatDateTime(d: Date): string {
  return d.toLocaleString("tr-TR", { timeZone: TIME_ZONE });
}

/** 13.07.2026 (locale ve ek seçenekler değiştirilebilir) */
export function formatDate(
  d: Date,
  locale: string = "tr-TR",
  options?: Intl.DateTimeFormatOptions
): string {
  return d.toLocaleDateString(locale, { timeZone: TIME_ZONE, ...options });
}

/** Grafiklerde ay bazlı gruplama için İstanbul saatine göre yıl ve ay (0-11). */
export function istanbulYearMonth(d: Date): { year: number; month: number } {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "numeric",
  }).formatToParts(d);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month") - 1 };
}
