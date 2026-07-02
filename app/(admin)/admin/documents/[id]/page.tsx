import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import PageDurationChart from "./PageDurationChart";
import DropoffChart from "./DropoffChart";
import MonthlyChart from "../../_components/MonthlyChart";
import CountryMapLoader from "../../_components/CountryMapLoader";
import StatsCards from "../../_components/StatsCards";
import RecentVisitsTable from "../../_components/RecentVisitsTable";
import Breadcrumbs from "../../_components/Breadcrumbs";
import SectionHeading from "../../_components/SectionHeading";
import ThumbnailImage from "../../_components/ThumbnailImage";
import { formatDuration } from "@/lib/format-duration";
import { lookupCity } from "@/lib/geo";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export default async function DocumentAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();

  const events = await prisma.pageViewEvent.findMany({
    where: { documentId: id },
    include: { viewerSession: { select: { email: true } } },
  });

  const visits = await prisma.visit.findMany({
    where: { documentId: id },
    include: { pageViewEvents: true, viewerSession: { select: { email: true } } },
    orderBy: { startedAt: "desc" },
  });

  // Per-viewer (email) totals for the "who viewed how much" table.
  const totalsByViewer = new Map<string, number>();
  for (const event of events) {
    totalsByViewer.set(
      event.viewerSession.email,
      (totalsByViewer.get(event.viewerSession.email) ?? 0) + event.durationMs
    );
  }
  const totalEngagementMs = events.reduce((sum: number, e) => sum + e.durationMs, 0);

  // Drop-off: of all visits, what % reached at least page N (proxy: max page seen in that visit).
  const totalVisits = visits.length;
  const dropoffData = Array.from({ length: document.pageCount }, (_, i) => {
    const page = i + 1;
    const reached = visits.filter((v) => {
      const maxPage = v.pageViewEvents.reduce((m, e) => Math.max(m, e.pageNumber), 0);
      return maxPage >= page;
    }).length;
    return {
      page,
      percent: totalVisits === 0 ? 0 : Math.round((reached / totalVisits) * 1000) / 10,
      visitCount: reached,
    };
  });

  // Monthly trend: last 6 months including the current one.
  const now = new Date();
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const monthVisits = visits.filter((v) => {
      const vd = v.startedAt;
      return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth();
    });
    const seconds = Math.round(
      monthVisits.reduce(
        (sum, v) => sum + v.pageViewEvents.reduce((s, e) => s + e.durationMs, 0),
        0
      ) / 1000
    );
    return {
      month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
      visits: monthVisits.length,
      seconds,
    };
  });

  // Country aggregation (by visit, not by event, so one visit = one count regardless of page count).
  const countryCounts = new Map<string, number>();
  for (const visit of visits) {
    if (visit.country) {
      countryCounts.set(visit.country, (countryCounts.get(visit.country) ?? 0) + 1);
    }
  }
  const countryData = Array.from(countryCounts.entries()).map(([code, count]) => ({ code, count }));

  const recentVisits = visits.slice(0, 5).map((v) => ({
    id: v.id,
    startedAt: v.startedAt,
    email: v.viewerSession.email,
    country: v.country,
    city: lookupCity(v.ipAddress),
    userAgent: v.userAgent,
    durationMs: v.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0),
  }));

  const uniqueViewers = totalsByViewer.size;
  const avgVisitSeconds =
    totalVisits === 0 ? 0 : Math.round(totalEngagementMs / 1000 / totalVisits);

  const cell = "bg-shell/60 group-hover:bg-surface-muted transition-colors p-4";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8">
        <Breadcrumbs items={[{ label: "Panel", href: "/admin" }, { label: document.title }]} />
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1">{document.title}</h1>
            <p className="text-sm text-ink/60 mb-1">
              Toplam izlenme süresi:{" "}
              <span className="text-ember font-mono font-bold">
                {formatDuration(totalEngagementMs / 1000)}
              </span>{" "}
              · Toplam ziyaret:{" "}
              <span className="text-signal-dim font-mono font-bold">{totalVisits}</span>
            </p>
            <p className="text-xs text-ink/45">
              Son güncelleme:{" "}
              <span className="font-semibold text-ink">
                {document.updatedAt.toLocaleString("tr-TR")}
              </span>{" "}
              · <span className="font-semibold text-ink">{document.pageCount} sayfa</span>
            </p>
          </div>
          <ThumbnailImage
            src={`/api/documents/${document.slug}/thumbnail/1`}
            alt={`${document.title} kapak sayfası`}
            className="w-16 h-auto rounded-lg border border-rule shadow-sm shrink-0"
          />
        </div>
      </div>

      <StatsCards
        totalVisits={totalVisits}
        uniqueViewers={uniqueViewers}
        avgVisitSeconds={avgVisitSeconds}
        totalSeconds={Math.round(totalEngagementMs / 1000)}
      />

      <section className="bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Son Ziyaretler</SectionHeading>
        <RecentVisitsTable visits={recentVisits} bare />
      </section>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Sayfa Bazında İzlenme Süresi</SectionHeading>
        <PageDurationChart documentId={id} documentSlug={document.slug} pageCount={document.pageCount} />
        <p className="text-xs text-ink/40 mt-3">
          Bir sütunun üzerine gelince o sayfanın görseli ve toplam saniyesi görünür.
        </p>
      </section>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Drop-off Raporu</SectionHeading>
        <DropoffChart data={dropoffData} />
        <p className="text-xs text-ink/40 mt-3">
          Ziyaretlerin yüzde kaçı her sayfaya kadar okumaya devam etmiş — düşüşün başladığı yer
          okuyucuların bırakma noktasıdır.
        </p>
      </section>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Aylık İzlenme Trendi</SectionHeading>
        <MonthlyChart data={monthlyData} />
      </section>

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Görüntüleyenlerin Konumu</SectionHeading>
        <CountryMapLoader countries={countryData} />
      </section>

      <section className="bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Görüntüleyen Bazında Toplam</SectionHeading>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs text-ink/40">
                <th className="font-medium pb-2 pl-4">E-posta</th>
                <th className="font-medium pb-2">Toplam Süre</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from(totalsByViewer.entries()).map(([email, ms]) => (
                <tr key={email} className="group">
                  <td className={`${cell} rounded-l-2xl font-medium`}>{email}</td>
                  <td className={`${cell} font-mono text-xs text-ember`}>{formatDuration(ms / 1000)}</td>
                  <td className={`${cell} rounded-r-2xl`}>
                    <Link
                      href={`/admin/documents/${id}/viewers/${encodeURIComponent(email)}`}
                      className="text-signal-dim hover:text-signal transition-colors text-xs font-semibold"
                    >
                      Geçmişi gör →
                    </Link>
                  </td>
                </tr>
              ))}
              {totalsByViewer.size === 0 && (
                <tr>
                  <td className="p-4 text-ink/40" colSpan={3}>
                    Henüz görüntüleme yok.
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
