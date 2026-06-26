import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { describeUserAgent } from "@/lib/user-agent";
import CountryMapLoader from "../../../../_components/CountryMapLoader";
import Breadcrumbs from "../../../../_components/Breadcrumbs";
import SectionHeading from "../../../../_components/SectionHeading";
import ViewerPageChart from "./ViewerPageChart";
import { formatDuration } from "@/lib/format-duration";

const WINDOWS_DAYS = [7, 30, 90] as const;

export default async function ViewerHistoryPage({
  params,
}: {
  params: Promise<{ id: string; email: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id, email: encodedEmail } = await params;
  const email = decodeURIComponent(encodedEmail);

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();

  const viewerSession = await prisma.viewerSession.findUnique({
    where: { documentId_email: { documentId: id, email } },
  });
  if (!viewerSession) notFound();

  const visits = await prisma.visit.findMany({
    where: { viewerSessionId: viewerSession.id },
    orderBy: { startedAt: "desc" },
    include: { pageViewEvents: true },
  });

  const allEvents = visits.flatMap((v) => v.pageViewEvents);
  const now = Date.now();

  const windowTotalsMs = WINDOWS_DAYS.map((days) => {
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const totalMs = allEvents
      .filter((e) => e.createdAt.getTime() >= cutoff)
      .reduce((sum, e) => sum + e.durationMs, 0);
    return { days, totalMs };
  });

  const pageTotalsMs = new Map<number, number>();
  for (const e of allEvents) {
    pageTotalsMs.set(e.pageNumber, (pageTotalsMs.get(e.pageNumber) ?? 0) + e.durationMs);
  }
  const pageTotals = Array.from(pageTotalsMs.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([page, ms]) => ({ page, seconds: Math.round(ms / 1000) }));

  const countryCounts = new Map<string, number>();
  for (const visit of visits) {
    if (visit.country) {
      countryCounts.set(visit.country, (countryCounts.get(visit.country) ?? 0) + 1);
    }
  }
  const countryData = Array.from(countryCounts.entries()).map(([code, count]) => ({ code, count }));

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Genel Bakış", href: "/admin" },
          { label: document.title, href: `/admin/documents/${id}` },
          { label: email },
        ]}
      />
      <h1 className="font-display font-extrabold text-3xl mb-1">{email}</h1>
      <p className="font-mono text-xs text-ink/60 mb-10">
        İlk görüntüleme:{" "}
        <span className="font-semibold text-ink">
          {viewerSession.firstSeenAt.toLocaleString("tr-TR")}
        </span>{" "}
        · Son görüntüleme:{" "}
        <span className="font-semibold text-ink">
          {viewerSession.lastSeenAt.toLocaleString("tr-TR")}
        </span>{" "}
        · Toplam ziyaret:{" "}
        <span className="font-bold text-signal">{visits.length}</span>
      </p>

      <SectionHeading>Zaman Aralığına Göre Toplam İzlenme</SectionHeading>
      <div className="flex gap-4 mb-10">
        {windowTotalsMs.map(({ days, totalMs }) => (
          <div key={days} className="hover-lift bg-surface border border-rule rounded-2xl p-5 flex-1">
            <p className="font-display font-extrabold text-3xl">{formatDuration(totalMs / 1000)}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40">
              Son {days} gün
            </p>
          </div>
        ))}
      </div>

      <SectionHeading>Sayfa Bazında İzlenme Süresi</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <ViewerPageChart documentSlug={document.slug} pageCount={document.pageCount} data={pageTotals} />
        <p className="text-xs text-ink/30 mt-2">
          Bir sütunun üzerine gelince o sayfanın görseli ve toplam saniyesi görünür.
        </p>
      </div>

      <SectionHeading>Konum</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <CountryMapLoader countries={countryData} />
      </div>

      <SectionHeading>Ziyaret Geçmişi</SectionHeading>
      <div className="bg-surface border border-rule rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40 border-b border-rule bg-surface-muted">
            <tr>
              <th className="p-4">Tarih</th>
              <th className="p-4">Süre</th>
              <th className="p-4">Ülke</th>
              <th className="p-4">Cihaz</th>
              <th className="p-4">IP</th>
              <th className="p-4">Geldiği Yer</th>
            </tr>
          </thead>
          <tbody>
            {visits.map((visit) => {
              const visitMs = visit.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0);
              return (
                <tr key={visit.id} className="border-t border-rule transition-colors hover:bg-surface-muted">
                  <td className="p-4 font-mono text-xs text-ink/50">
                    {visit.startedAt.toLocaleString("tr-TR")}
                  </td>
                  <td className="p-4 font-mono text-ember">{formatDuration(visitMs / 1000)}</td>
                  <td className="p-4">{visit.country ?? "—"}</td>
                  <td className="p-4 text-ink/50 text-xs">{describeUserAgent(visit.userAgent)}</td>
                  <td className="p-4 font-mono text-xs text-ink/40">{visit.ipAddress ?? "—"}</td>
                  <td className="p-4 truncate max-w-[160px] text-ink/40 text-xs">
                    {visit.referrer || "—"}
                  </td>
                </tr>
              );
            })}
            {visits.length === 0 && (
              <tr>
                <td className="p-4 text-ink/40" colSpan={6}>
                  Henüz ziyaret yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
