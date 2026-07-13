import Link from "next/link";
import { describeUserAgent } from "@/lib/user-agent";
import { formatDateTime } from "@/lib/format-date";
import { formatDuration } from "@/lib/format-duration";
import { countryFlagUrl } from "@/lib/country-flag";
import CountryFlagImg from "./CountryFlagImg";

type VisitRow = {
  id: string;
  startedAt: Date;
  email: string;
  country: string | null;
  city?: string | null;
  userAgent: string | null;
  durationMs: number;
  documentTitle?: string;
  documentId?: string;
  documentVersion?: number;
};

const cell = "bg-shell/60 group-hover:bg-surface-muted transition-colors p-4";

export default function RecentVisitsTable({ visits, bare = false }: { visits: VisitRow[]; bare?: boolean }) {
  const showDocument = visits.some((v) => v.documentTitle);
  const showVersion = visits.some((v) => v.documentVersion !== undefined);
  const columnCount = 5 + (showDocument ? 1 : 0) + (showVersion ? 1 : 0);

  return (
    <div className={bare ? "overflow-x-auto" : "bg-surface rounded-[28px] p-6 overflow-x-auto"}>
      <table className="w-full text-sm min-w-[640px] border-separate border-spacing-y-1.5">
        <thead>
          <tr className="text-left text-xs text-ink/40">
            <th className="font-medium pb-2 pl-4">Tarih</th>
            {showDocument && <th className="font-medium pb-2">Döküman</th>}
            <th className="font-medium pb-2">E-posta</th>
            {showVersion && <th className="font-medium pb-2">Versiyon</th>}
            <th className="font-medium pb-2">Süre</th>
            <th className="font-medium pb-2">Ülke</th>
            <th className="font-medium pb-2">Cihaz</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr key={v.id} className="group">
              <td className={`${cell} rounded-l-2xl font-mono text-xs text-ink/50 whitespace-nowrap`}>
                {formatDateTime(v.startedAt)}
              </td>
              {showDocument && (
                <td className={cell}>
                  {v.documentId ? (
                    <Link
                      href={`/admin/documents/${v.documentId}`}
                      className="font-semibold text-ink hover:text-signal transition-colors"
                    >
                      {v.documentTitle}
                    </Link>
                  ) : (
                    v.documentTitle
                  )}
                </td>
              )}
              <td className={`${cell} break-all`}>
                {v.documentId ? (
                  <Link
                    href={`/admin/documents/${v.documentId}/viewers/${encodeURIComponent(v.email)}`}
                    className="hover:text-signal transition-colors"
                    title="Bu kişinin izleme geçmişini gör"
                  >
                    {v.email}
                  </Link>
                ) : (
                  v.email
                )}
              </td>
              {showVersion && (
                <td className={`${cell} font-mono text-xs text-ink/50`}>
                  {v.documentVersion !== undefined ? `v${v.documentVersion}` : "—"}
                </td>
              )}
              <td className={`${cell} font-mono text-xs text-ember`}>{formatDuration(v.durationMs / 1000)}</td>
              <td className={`${cell} text-ink/60 whitespace-nowrap`} title={v.city ? "IP tabanlı tahmini konum" : undefined}>
                <span className="inline-flex items-center gap-1.5">
                  {countryFlagUrl(v.country) && (
                    <CountryFlagImg src={countryFlagUrl(v.country)!} className="w-4 h-3 rounded-[2px] object-cover shrink-0" />
                  )}
                  {v.country ?? "—"}
                  {v.city && <span className="text-ink/40 text-xs"> · {v.city}</span>}
                </span>
              </td>
              <td className={`${cell} rounded-r-2xl text-ink/40 text-xs`}>{describeUserAgent(v.userAgent)}</td>
            </tr>
          ))}
          {visits.length === 0 && (
            <tr>
              <td className="p-4 text-ink/40" colSpan={columnCount}>
                Henüz ziyaret yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
