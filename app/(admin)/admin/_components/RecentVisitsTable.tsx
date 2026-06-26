import Link from "next/link";
import { describeUserAgent } from "@/lib/user-agent";
import { formatDuration } from "@/lib/format-duration";

type VisitRow = {
  id: string;
  startedAt: Date;
  email: string;
  country: string | null;
  userAgent: string | null;
  durationMs: number;
  documentTitle?: string;
  documentId?: string;
};

export default function RecentVisitsTable({ visits }: { visits: VisitRow[] }) {
  const showDocument = visits.some((v) => v.documentTitle);

  return (
    <div className="bg-surface border border-rule rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40 border-b border-rule bg-surface-muted">
          <tr>
            <th className="p-4">Tarih</th>
            {showDocument && <th className="p-4">Döküman</th>}
            <th className="p-4">E-posta</th>
            <th className="p-4">Süre</th>
            <th className="p-4">Ülke</th>
            <th className="p-4">Cihaz</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((v) => (
            <tr
              key={v.id}
              className="border-t border-rule transition-colors hover:bg-surface-muted"
            >
              <td className="p-4 font-mono text-xs text-ink/50">
                {v.startedAt.toLocaleString("tr-TR")}
              </td>
              {showDocument && (
                <td className="p-4">
                  {v.documentId ? (
                    <Link
                      href={`/admin/documents/${v.documentId}`}
                      className="text-signal hover:text-signal-dim transition-colors"
                    >
                      {v.documentTitle}
                    </Link>
                  ) : (
                    v.documentTitle
                  )}
                </td>
              )}
              <td className="p-4">{v.email}</td>
              <td className="p-4 font-mono text-ember">{formatDuration(v.durationMs / 1000)}</td>
              <td className="p-4 text-ink/60">{v.country ?? "—"}</td>
              <td className="p-4 text-ink/40 text-xs">{describeUserAgent(v.userAgent)}</td>
            </tr>
          ))}
          {visits.length === 0 && (
            <tr>
              <td className="p-4 text-ink/40" colSpan={showDocument ? 6 : 5}>
                Henüz ziyaret yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
