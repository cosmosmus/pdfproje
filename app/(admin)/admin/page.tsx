import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { aggregateCountryData } from "@/lib/country-data";
import { formatDate, istanbulYearMonth } from "@/lib/format-date";
import dynamic from "next/dynamic";
import StatsCards from "./_components/StatsCards";
import CountryMapLoader from "./_components/CountryMapLoader";

// Recharts ağır bir paket: grafikler ayrı chunk'ta, sabit yükseklikli iskeletle gelir.
const chartSkeleton = () => <div className="h-[260px] animate-pulse bg-surface-muted rounded-xl" />;
const TopDocumentsChart = dynamic(() => import("./_components/TopDocumentsChart"), { loading: chartSkeleton });
const MonthlyChart = dynamic(() => import("./_components/MonthlyChart"), { loading: chartSkeleton });
import RecentVisitsTable from "./_components/RecentVisitsTable";
import LiveVisitors from "./_components/LiveVisitors";
import LinkRowActions from "./_components/LinkRowActions";
import ReplacePdfButton from "./_components/ReplacePdfButton";
import DocumentRowActions from "./_components/DocumentRowActions";
import SectionHeading from "./_components/SectionHeading";
import { IconUpload, IconPdfFile } from "./_components/icons";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  // Yalnızca ekranda kullanılan kolonları çek; bağımsız sorguları paralel çalıştır.
  const [documents, headersList, visits] = await Promise.all([
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { viewerSessions: true } } },
    }),
    headers(),
    prisma.visit.findMany({
      select: {
        id: true,
        startedAt: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        userAgent: true,
        ipAddress: true,
        pageViewEvents: { select: { durationMs: true } },
        viewerSession: { select: { email: true } },
        document: { select: { id: true, title: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
  ]);

  const host = headersList.get("host");
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";

  const totalVisits = visits.length;
  const totalEngagementMs = visits.reduce(
    (sum, v) => sum + v.pageViewEvents.reduce((s, e) => s + e.durationMs, 0),
    0
  );
  const uniqueViewers = new Set(visits.map((v) => v.viewerSession.email)).size;
  const avgVisitSeconds =
    totalVisits === 0 ? 0 : Math.round(totalEngagementMs / 1000 / totalVisits);

  // Top documents by total engagement time.
  const docTotalsMs = new Map<string, { title: string; ms: number }>();
  for (const v of visits) {
    const ms = v.pageViewEvents.reduce((s, e) => s + e.durationMs, 0);
    const existing = docTotalsMs.get(v.document.id);
    if (existing) existing.ms += ms;
    else docTotalsMs.set(v.document.id, { title: v.document.title, ms });
  }
  const topDocumentsData = Array.from(docTotalsMs.values())
    .map((d) => ({ title: d.title, seconds: Math.round(d.ms / 1000) }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 8);

  // Monthly trend across all documents, last 6 months (İstanbul saatine göre).
  const nowYm = istanbulYearMonth(new Date());
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(nowYm.year, nowYm.month - (5 - i), 1);
    const monthVisits = visits.filter((v) => {
      const vd = istanbulYearMonth(v.startedAt);
      return vd.year === d.getFullYear() && vd.month === d.getMonth();
    });
    const seconds = Math.round(
      monthVisits.reduce(
        (sum, v) => sum + v.pageViewEvents.reduce((s, e) => s + e.durationMs, 0),
        0
      ) / 1000
    );
    return { month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, visits: monthVisits.length, seconds };
  });

  // Country aggregation across all documents. Harita "kaç farklı kişi baktı"
  // göstersin diye kişi başına en son ziyarete indirgeniyor — aynı kişinin
  // tekrar ziyaretleri (visits zaten en yeniden eskiye sıralı) pini şişirmesin.
  const seenEmailsForMap = new Set<string>();
  const uniqueVisitorLocations = visits.filter((v) => {
    const email = v.viewerSession.email;
    if (seenEmailsForMap.has(email)) return false;
    seenEmailsForMap.add(email);
    return true;
  });
  const countryData = aggregateCountryData(uniqueVisitorLocations);

  const recentVisits = visits.slice(0, 5).map((v) => ({
    id: v.id,
    startedAt: v.startedAt,
    email: v.viewerSession.email,
    country: v.country,
    city: v.city,
    userAgent: v.userAgent,
    durationMs: v.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0),
    documentTitle: v.document.title,
    documentId: v.document.id,
  }));

  const cell = "bg-shell/60 group-hover:bg-surface-muted transition-colors p-4";

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold text-2xl tracking-tight">Panel</h1>
          <p className="text-sm text-ink/45 mt-0.5">Vitrin&apos;deki her şey, tek bakışta.</p>
        </div>
        <Link
          href="/admin/documents/new"
          className="flex items-center gap-2 rounded-full bg-ink text-surface font-semibold px-5 py-2.5 text-sm hover:bg-ink-soft transition-colors whitespace-nowrap"
        >
          <IconUpload className="w-4 h-4" />
          Yeni PDF Yükle
        </Link>
      </div>

      {documents.length === 0 ? null : <LiveVisitors />}

      {documents.length === 0 ? null : (
        <StatsCards
          totalVisits={totalVisits}
          uniqueViewers={uniqueViewers}
          avgVisitSeconds={avgVisitSeconds}
          totalSeconds={Math.round(totalEngagementMs / 1000)}
        />
      )}

      <section className="bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Dökümanlar</SectionHeading>
        {documents.length === 0 ? (
          <p className="text-ink/50">Henüz döküman yok. Yukarıdan ilk PDF&apos;ini yükleyebilirsin.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px] border-separate border-spacing-y-1.5">
              <thead>
                <tr className="text-left text-xs text-ink/40">
                  <th className="font-medium pb-2 pl-4">Başlık</th>
                  <th className="font-medium pb-2 whitespace-nowrap">Sayfa</th>
                  <th className="font-medium pb-2 whitespace-nowrap">Görüntüleyen</th>
                  <th className="font-medium pb-2 whitespace-nowrap">Güncelleme</th>
                  <th className="font-medium pb-2">Link</th>
                  <th className="font-medium pb-2">İstatistik</th>
                  <th className="font-medium pb-2">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className={`group ${!doc.isActive ? "opacity-50" : ""}`}>
                    <td className={`${cell} rounded-l-2xl font-semibold`}>
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ember/10 shrink-0">
                          <IconPdfFile className="w-4.5 h-4.5 text-ember-dim" />
                        </span>
                        {doc.title}
                        {!doc.isActive && (
                          <span className="rounded-full bg-surface-muted text-ink/45 text-xs font-semibold px-3 py-1">
                            Pasif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className={`${cell} text-ink/60 font-mono text-xs whitespace-nowrap`}>{doc.pageCount}</td>
                    <td className={`${cell} text-ink/60 font-mono text-xs whitespace-nowrap`}>{doc._count.viewerSessions}</td>
                    <td className={`${cell} text-ink/50 font-mono text-xs whitespace-nowrap`}>
                      {formatDate(doc.updatedAt)}
                    </td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <div className="flex items-center gap-2">
                        <ReplacePdfButton documentId={doc.id} documentTitle={doc.title} />
                        <LinkRowActions documentId={doc.id} link={`${proto}://${host}/doc/${doc.slug}`} />
                      </div>
                    </td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <Link
                        href={`/admin/documents/${doc.id}`}
                        className="text-ember hover:text-ember-dim transition-colors text-xs font-semibold"
                      >
                        İstatistikler →
                      </Link>
                    </td>
                    <td className={`${cell} rounded-r-2xl whitespace-nowrap`}>
                      <DocumentRowActions documentId={doc.id} isActive={doc.isActive} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {documents.length === 0 ? null : (
        <>
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
            <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
              <SectionHeading>En Çok İlgi Gören Dökümanlar</SectionHeading>
              <TopDocumentsChart data={topDocumentsData} />
            </section>
            <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
              <SectionHeading>Aylık İzlenme Trendi</SectionHeading>
              <MonthlyChart data={monthlyData} />
            </section>
          </div>

          <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
            <SectionHeading>Görüntüleyenlerin Konumu</SectionHeading>
            <CountryMapLoader countries={countryData} />
          </section>

          <section className="bg-surface rounded-[28px] p-6 md:p-8">
            <SectionHeading>Son Ziyaretler</SectionHeading>
            <RecentVisitsTable visits={recentVisits} bare />
          </section>
        </>
      )}
    </div>
  );
}
