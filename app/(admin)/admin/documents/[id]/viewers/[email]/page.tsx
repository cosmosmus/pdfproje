import { redirect, notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { describeUserAgent } from "@/lib/user-agent";
import CountryMapLoader from "../../../../_components/CountryMapLoader";
import Breadcrumbs from "../../../../_components/Breadcrumbs";
import SectionHeading from "../../../../_components/SectionHeading";
import ViewerPageChart from "./ViewerPageChart";
import { formatDuration } from "@/lib/format-duration";
import { lookupCity } from "@/lib/geo";

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

  const cell = "bg-shell/60 group-hover:bg-surface-muted transition-colors p-4";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8">
        <Breadcrumbs
          items={[
            { label: "Panel", href: "/admin" },
            { label: document.title, href: `/admin/documents/${id}` },
            { label: email },
          ]}
        />
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">{email}</h1>
        <p className="text-xs text-ink/45">
          İlk görüntüleme:{" "}
          <span className="font-semibold text-ink">
            {viewerSession.firstSeenAt.toLocaleString("tr-TR")}
          </span>{" "}
          · Son görüntüleme:{" "}
          <span className="font-semibold text-ink">
            {viewerSession.lastSeenAt.toLocaleString("tr-TR")}
          </span>{" "}
          · Toplam ziyaret:{" "}
          <span className="font-bold text-signal-dim">{visits.length}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {windowTotalsMs.map(({ days, totalMs }) => (
          <div key={days} className="hover-lift rounded-[24px] bg-surface px-4 pt-6 pb-5 flex flex-col items-center text-center gap-1.5">
            <p className="font-display font-extrabold text-2xl leading-none">{formatDuration(totalMs / 1000)}</p>
            <p className="text-xs text-ink/45">Son {days} gün</p>
          </div>
        ))}
      </div>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Sayfa Bazında İzlenme Süresi</SectionHeading>
        <ViewerPageChart documentSlug={document.slug} pageCount={document.pageCount} data={pageTotals} />
        <p className="text-xs text-ink/40 mt-3">
          Bir sütunun üzerine gelince o sayfanın görseli ve toplam saniyesi görünür.
        </p>
      </section>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Konum</SectionHeading>
        <CountryMapLoader countries={countryData} />
      </section>

      <section className="bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Ziyaret Geçmişi</SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs text-ink/40">
                <th className="font-medium pb-2 pl-4">Tarih</th>
                <th className="font-medium pb-2">Süre</th>
                <th className="font-medium pb-2">Ülke</th>
                <th className="font-medium pb-2">Cihaz</th>
                <th className="font-medium pb-2">IP</th>
                <th className="font-medium pb-2">Geldiği Yer</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((visit) => {
                const visitMs = visit.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0);
                const city = lookupCity(visit.ipAddress);
                return (
                  <tr key={visit.id} className="group">
                    <td className={`${cell} rounded-l-2xl font-mono text-xs text-ink/50 whitespace-nowrap`}>
                      {visit.startedAt.toLocaleString("tr-TR")}
                    </td>
                    <td className={`${cell} font-mono text-xs text-ember`}>{formatDuration(visitMs / 1000)}</td>
                    <td className={`${cell} whitespace-nowrap`} title={city ? "IP tabanlı tahmini konum" : undefined}>
                      {visit.country ?? "—"}
                      {city && <span className="text-ink/40 text-xs"> · {city}</span>}
                    </td>
                    <td className={`${cell} text-ink/50 text-xs`}>{describeUserAgent(visit.userAgent)}</td>
                    <td className={`${cell} font-mono text-xs text-ink/40`}>{visit.ipAddress ?? "—"}</td>
                    <td className={`${cell} rounded-r-2xl truncate max-w-[160px] text-ink/40 text-xs`}>
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
      </section>
    </div>
  );
}
