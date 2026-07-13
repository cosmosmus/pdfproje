import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { aggregateCountryData } from "@/lib/country-data";
import { formatDateTime, formatDate, istanbulYearMonth } from "@/lib/format-date";
import dynamic from "next/dynamic";
import CountryMapLoader from "../../_components/CountryMapLoader";

// Recharts ağır bir paket: grafikler ayrı chunk'ta, sabit yükseklikli iskeletle gelir.
const chartSkeleton = () => <div className="h-[260px] animate-pulse bg-surface-muted rounded-xl" />;
const PageDurationChart = dynamic(() => import("./PageDurationChart"), { loading: chartSkeleton });
const DropoffChart = dynamic(() => import("./DropoffChart"), { loading: chartSkeleton });
const MonthlyChart = dynamic(() => import("../../_components/MonthlyChart"), { loading: chartSkeleton });
import StatsCards from "../../_components/StatsCards";
import RecentVisitsTable from "../../_components/RecentVisitsTable";
import Breadcrumbs from "../../_components/Breadcrumbs";
import SectionHeading from "../../_components/SectionHeading";
import ThumbnailImage from "../../_components/ThumbnailImage";
import { formatDuration } from "@/lib/format-duration";
import { countryFlagUrl } from "@/lib/country-flag";
import CountryFlagImg from "../../_components/CountryFlagImg";

const MONTH_LABELS = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export default async function DocumentAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) notFound();

  // Yalnızca kullanılan kolonları çek; bağımsız sorguları paralel çalıştır.
  const [events, visits, versions] = await Promise.all([
    prisma.pageViewEvent.findMany({
      where: { documentId: id },
      select: { durationMs: true, viewerSession: { select: { email: true } } },
    }),
    prisma.visit.findMany({
      where: { documentId: id },
      select: {
        id: true,
        startedAt: true,
        country: true,
        city: true,
        latitude: true,
        longitude: true,
        userAgent: true,
        ipAddress: true,
        documentVersion: true,
        pageViewEvents: { select: { pageNumber: true, durationMs: true } },
        viewerSession: { select: { email: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: "asc" },
      select: { version: true, pageCount: true, createdAt: true },
    }),
  ]);

  // Sayfa bazlı grafikler seçili PDF versiyonuna göre filtrelenir: eski PDF'in
  // 5. sayfası ile yeni PDF'in 5. sayfası aynı içerik olmayabilir.
  const { v: versionParam } = await searchParams;
  const requestedVersion = versionParam ? Number(versionParam) : NaN;
  const selectedVersion =
    versions.find((ver) => ver.version === requestedVersion) ??
    versions.find((ver) => ver.version === document.version) ??
    { version: document.version, pageCount: document.pageCount, createdAt: document.createdAt };
  const versionVisits = visits.filter((v) => v.documentVersion === selectedVersion.version);

  // Per-viewer (email) totals for the "who viewed how much" table.
  const totalsByViewer = new Map<string, number>();
  for (const event of events) {
    totalsByViewer.set(
      event.viewerSession.email,
      (totalsByViewer.get(event.viewerSession.email) ?? 0) + event.durationMs
    );
  }
  const totalEngagementMs = events.reduce((sum: number, e) => sum + e.durationMs, 0);

  // Drop-off: of the selected version's visits, what % reached at least page N
  // (proxy: max page seen in that visit).
  const totalVisits = visits.length;
  const versionVisitCount = versionVisits.length;
  const dropoffData = Array.from({ length: selectedVersion.pageCount }, (_, i) => {
    const page = i + 1;
    const reached = versionVisits.filter((v) => {
      const maxPage = v.pageViewEvents.reduce((m, e) => Math.max(m, e.pageNumber), 0);
      return maxPage >= page;
    }).length;
    return {
      page,
      percent: versionVisitCount === 0 ? 0 : Math.round((reached / versionVisitCount) * 1000) / 10,
      visitCount: reached,
    };
  });

  // Monthly trend: last 6 months including the current one (İstanbul saatine göre).
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
    return {
      month: `${MONTH_LABELS[d.getMonth()]} ${d.getFullYear()}`,
      visits: monthVisits.length,
      seconds,
    };
  });

  // Country aggregation: kişi başına en son ziyarete indirgenir (visits en
  // yeniden eskiye sıralı) ki aynı kişinin tekrar ziyaretleri pini şişirmesin
  // — harita "kaç farklı kişi baktı" gösterir, "kaç kere bakıldı" değil.
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
    documentId: id,
    documentVersion: v.documentVersion,
  }));

  // Görüntüleyen bazında versiyon ve ülke kırılımı (ziyaretlerden).
  const viewerInfo = new Map<string, { countries: Set<string>; versions: Set<number> }>();
  for (const v of visits) {
    const email = v.viewerSession.email;
    let info = viewerInfo.get(email);
    if (!info) {
      info = { countries: new Set(), versions: new Set() };
      viewerInfo.set(email, info);
    }
    if (v.country) info.countries.add(v.country);
    info.versions.add(v.documentVersion);
  }

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
            <h1 className="font-display font-extrabold text-2xl tracking-tight mb-1 break-words">{document.title}</h1>
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
                {formatDateTime(document.updatedAt)}
              </span>{" "}
              · <span className="font-semibold text-ink">{document.pageCount} sayfa</span>
            </p>
          </div>
          <ThumbnailImage
            src={`/api/documents/${document.slug}/thumbnail/1?v=${document.version}`}
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

      {versions.length > 1 && (
        <section className="bg-surface rounded-[28px] px-6 py-4 md:px-8 flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/45">
            PDF Versiyonu
          </span>
          <div className="flex flex-wrap gap-1">
            {versions.map((ver) => (
              <Link
                key={ver.version}
                href={
                  ver.version === document.version
                    ? `/admin/documents/${id}`
                    : `/admin/documents/${id}?v=${ver.version}`
                }
                className={`px-3 py-1.5 rounded-md font-mono text-[11px] uppercase tracking-[0.08em] transition-colors ${
                  ver.version === selectedVersion.version
                    ? "bg-signal text-white"
                    : "text-ink/50 hover:text-ink hover:bg-surface-muted"
                }`}
              >
                v{ver.version}
                {ver.version === document.version && " · güncel"}
              </Link>
            ))}
          </div>
          <span className="text-xs text-ink/40">
            {selectedVersion.pageCount} sayfa ·{" "}
            {formatDate(selectedVersion.createdAt)} ·{" "}
            {versionVisitCount} ziyaret — aşağıdaki sayfa bazlı grafikler bu versiyona aittir
          </span>
        </section>
      )}

      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <SectionHeading>Sayfa Bazında İzlenme Süresi</SectionHeading>
        <PageDurationChart
          documentId={id}
          documentSlug={document.slug}
          pageCount={selectedVersion.pageCount}
          version={selectedVersion.version}
        />
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
          <table className="w-full text-sm min-w-[640px] border-separate border-spacing-y-1.5">
            <thead>
              <tr className="text-left text-xs text-ink/40">
                <th className="font-medium pb-2 pl-4">E-posta</th>
                <th className="font-medium pb-2">Toplam Süre</th>
                <th className="font-medium pb-2">Versiyon</th>
                <th className="font-medium pb-2">Ülke</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from(totalsByViewer.entries()).map(([email, ms]) => {
                const info = viewerInfo.get(email);
                const versions = info ? Array.from(info.versions).sort((a, b) => a - b) : [];
                const countries = info ? Array.from(info.countries) : [];
                return (
                  <tr key={email} className="group">
                    <td className={`${cell} rounded-l-2xl font-medium break-all`}>{email}</td>
                    <td className={`${cell} font-mono text-xs text-ember`}>{formatDuration(ms / 1000)}</td>
                    <td className={`${cell} font-mono text-xs text-ink/50 whitespace-nowrap`}>
                      {versions.length > 0 ? versions.map((ver) => `v${ver}`).join(", ") : "—"}
                    </td>
                    <td className={`${cell} whitespace-nowrap`}>
                      {countries.length > 0
                        ? countries.map((code) => (
                            <span key={code} className="mr-2 text-xs text-ink/60 inline-flex items-center gap-1">
                              {countryFlagUrl(code) && (
                                <CountryFlagImg src={countryFlagUrl(code)!} className="w-4 h-3 rounded-[2px] object-cover shrink-0" />
                              )}
                              {code}
                            </span>
                          ))
                        : "—"}
                    </td>
                    <td className={`${cell} rounded-r-2xl`}>
                      <Link
                        href={`/admin/documents/${id}/viewers/${encodeURIComponent(email)}`}
                        className="text-signal-dim hover:text-signal transition-colors text-xs font-semibold"
                      >
                        Geçmişi gör →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {totalsByViewer.size === 0 && (
                <tr>
                  <td className="p-4 text-ink/40" colSpan={5}>
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
