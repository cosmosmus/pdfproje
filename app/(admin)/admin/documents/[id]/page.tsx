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
    userAgent: v.userAgent,
    durationMs: v.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0),
  }));

  const uniqueViewers = totalsByViewer.size;
  const avgVisitSeconds =
    totalVisits === 0 ? 0 : Math.round(totalEngagementMs / 1000 / totalVisits);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Genel Bakış", href: "/admin" }, { label: document.title }]} />
      <div className="flex items-start justify-between gap-6 mb-1">
        <div className="flex-1">
          <h1 className="font-display font-extrabold text-3xl mb-1">{document.title}</h1>
          <p className="text-ink/70 mb-1">
            Toplam izlenme süresi:{" "}
            <span className="text-ember font-mono font-bold text-base">
              {formatDuration(totalEngagementMs / 1000)}
            </span>{" "}
            · Toplam ziyaret:{" "}
            <span className="text-signal font-mono font-bold text-base">{totalVisits}</span>
          </p>
          <p className="font-mono text-xs text-ink/60">
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
          className="w-16 h-auto rounded border border-rule-paper shadow-sm shrink-0"
        />
      </div>
      <div className="mb-10 mt-7">
        <StatsCards
          totalVisits={totalVisits}
          uniqueViewers={uniqueViewers}
          avgVisitSeconds={avgVisitSeconds}
          totalSeconds={Math.round(totalEngagementMs / 1000)}
        />
      </div>

      <SectionHeading>Son Ziyaretler</SectionHeading>
      <div className="mb-10">
        <RecentVisitsTable visits={recentVisits} />
      </div>

      <SectionHeading>Sayfa Bazında İzlenme Süresi</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <PageDurationChart documentId={id} documentSlug={document.slug} pageCount={document.pageCount} />
        <p className="text-xs text-ink/30 mt-2">
          Bir sütunun üzerine gelince o sayfanın görseli ve toplam saniyesi görünür.
        </p>
      </div>

      <SectionHeading>Drop-off Raporu</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <DropoffChart data={dropoffData} />
        <p className="text-xs text-ink/30 mt-2">
          Ziyaretlerin yüzde kaçı her sayfaya kadar okumaya devam etmiş — düşüşün başladığı yer
          okuyucuların bırakma noktasıdır.
        </p>
      </div>

      <SectionHeading>Aylık İzlenme Trendi</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <MonthlyChart data={monthlyData} />
      </div>

      <SectionHeading>Görüntüleyenlerin Konumu</SectionHeading>
      <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
        <CountryMapLoader countries={countryData} />
      </div>

      <SectionHeading>Görüntüleyen Bazında Toplam</SectionHeading>
      <div className="bg-surface border border-rule rounded-2xl overflow-hidden mb-10">
        <table className="w-full text-sm">
          <thead className="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40 border-b border-rule bg-surface-muted">
            <tr>
              <th className="p-4">E-posta</th>
              <th className="p-4">Toplam Süre</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {Array.from(totalsByViewer.entries()).map(([email, ms]) => (
              <tr key={email} className="border-t border-rule transition-colors hover:bg-surface-muted">
                <td className="p-4">{email}</td>
                <td className="p-4 font-mono text-ember">{formatDuration(ms / 1000)}</td>
                <td className="p-4">
                  <Link
                    href={`/admin/documents/${id}/viewers/${encodeURIComponent(email)}`}
                    className="text-signal hover:text-signal-dim transition-colors text-xs font-medium uppercase tracking-wide"
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
    </div>
  );
}
