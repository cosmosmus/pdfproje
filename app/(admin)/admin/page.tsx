import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import StatsCards from "./_components/StatsCards";
import TopDocumentsChart from "./_components/TopDocumentsChart";
import MonthlyChart from "./_components/MonthlyChart";
import CountryMapLoader from "./_components/CountryMapLoader";
import RecentVisitsTable from "./_components/RecentVisitsTable";
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

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { viewerSessions: true } } },
  });

  const headersList = await headers();
  const host = headersList.get("host");
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";

  const visits = await prisma.visit.findMany({
    include: {
      pageViewEvents: true,
      viewerSession: { select: { email: true } },
      document: { select: { id: true, title: true } },
    },
    orderBy: { startedAt: "desc" },
  });

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

  // Monthly trend across all documents, last 6 months.
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
    return { month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`, visits: monthVisits.length, seconds };
  });

  // Country aggregation across all documents.
  const countryCounts = new Map<string, number>();
  for (const v of visits) {
    if (v.country) countryCounts.set(v.country, (countryCounts.get(v.country) ?? 0) + 1);
  }
  const countryData = Array.from(countryCounts.entries()).map(([code, count]) => ({ code, count }));

  const recentVisits = visits.slice(0, 5).map((v) => ({
    id: v.id,
    startedAt: v.startedAt,
    email: v.viewerSession.email,
    country: v.country,
    userAgent: v.userAgent,
    durationMs: v.pageViewEvents.reduce((sum, e) => sum + e.durationMs, 0),
    documentTitle: v.document.title,
    documentId: v.document.id,
  }));

  return (
    <div>
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40 mb-1">
            Genel Bakış
          </p>
          <h1 className="font-display font-extrabold text-3xl">Vitrin&apos;deki her şey</h1>
        </div>
        <Link
          href="/admin/documents/new"
          className="flex items-center gap-2 bg-signal text-white font-bold rounded-lg px-4 py-2.5 text-sm hover:bg-signal-dim transition-colors whitespace-nowrap"
        >
          <IconUpload className="w-4 h-4" />
          Yeni PDF Yükle
        </Link>
      </div>

      <SectionHeading>Dökümanlar</SectionHeading>
      {documents.length === 0 ? (
        <p className="text-ink/50 mb-10">Henüz döküman yok.</p>
      ) : (
        <div className="bg-surface border border-rule rounded-2xl overflow-hidden mb-10">
          <table className="w-full text-sm">
            <thead className="text-left font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40 border-b border-rule bg-surface-muted">
              <tr>
                <th className="p-4">Başlık</th>
                <th className="p-4 whitespace-nowrap">Sayfa</th>
                <th className="p-4 whitespace-nowrap">Görüntüleyen</th>
                <th className="p-4 whitespace-nowrap">Güncelleme</th>
                <th className="p-4">Link</th>
                <th className="p-4">İstatistik</th>
                <th className="p-4">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className={`border-t border-rule transition-colors hover:bg-surface-muted ${!doc.isActive ? "opacity-50" : ""}`}>
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2.5">
                      <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-ember/10 shrink-0">
                        <IconPdfFile className="w-5 h-5 text-ember-dim" />
                      </span>
                      {doc.title}
                      {!doc.isActive && (
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ink/40 bg-surface-muted border border-rule rounded px-1.5 py-0.5">
                          pasif
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-ink/60 font-mono whitespace-nowrap">{doc.pageCount}</td>
                  <td className="p-4 text-ink/60 font-mono whitespace-nowrap">{doc._count.viewerSessions}</td>
                  <td className="p-4 text-ink/40 font-mono text-xs whitespace-nowrap">
                    {doc.updatedAt.toLocaleDateString("tr-TR")}
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ReplacePdfButton documentId={doc.id} />
                      <a
                        href={`/d/${doc.slug}`}
                        target="_blank"
                        className="font-mono text-xs text-signal hover:text-signal-dim transition-colors"
                      >
                        /d/{doc.slug}
                      </a>
                      <LinkRowActions documentId={doc.id} link={`${proto}://${host}/d/${doc.slug}`} />
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <Link
                      href={`/admin/documents/${doc.id}`}
                      className="text-ember hover:text-ember-dim transition-colors text-xs font-medium uppercase tracking-wide"
                    >
                      İstatistikler →
                    </Link>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <DocumentRowActions documentId={doc.id} isActive={doc.isActive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {documents.length === 0 ? null : (
        <>
          <div className="mb-10">
            <StatsCards
              totalVisits={totalVisits}
              uniqueViewers={uniqueViewers}
              avgVisitSeconds={avgVisitSeconds}
              totalSeconds={Math.round(totalEngagementMs / 1000)}
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <div>
              <SectionHeading>En Çok İlgi Gören Dökümanlar</SectionHeading>
              <div className="hover-lift bg-surface border border-rule rounded-2xl p-5">
                <TopDocumentsChart data={topDocumentsData} />
              </div>
            </div>
            <div>
              <SectionHeading>Aylık İzlenme Trendi</SectionHeading>
              <div className="hover-lift bg-surface border border-rule rounded-2xl p-5">
                <MonthlyChart data={monthlyData} />
              </div>
            </div>
          </div>

          <SectionHeading>Görüntüleyenlerin Konumu</SectionHeading>
          <div className="hover-lift bg-surface border border-rule rounded-2xl p-5 mb-10">
            <CountryMapLoader countries={countryData} />
          </div>

          <SectionHeading>Son Ziyaretler</SectionHeading>
          <div className="mb-10">
            <RecentVisitsTable visits={recentVisits} />
          </div>
        </>
      )}
    </div>
  );
}
