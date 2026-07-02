import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vitrin — Yeni Arayüz Önerisi",
};

const quickStats = [
  { label: "Toplam döküman", value: "24", icon: "doc" },
  { label: "Görüntülenme", value: "3.2K", icon: "eye" },
  { label: "Şu an izliyor", value: "7", icon: "live", dark: true },
  { label: "Tekil izleyici", value: "486", icon: "users" },
  { label: "Ort. okuma", value: "4d 12s", icon: "clock" },
  { label: "Bekleyen davet", value: "12", icon: "mail" },
];

const months = [
  { name: "Oca", views: 32, unique: 18 },
  { name: "Şub", views: 58, unique: 30 },
  { name: "Mar", views: 44, unique: 26 },
  { name: "Nis", views: 70, unique: 42 },
  { name: "May", views: 52, unique: 28 },
  { name: "Haz", views: 96, unique: 60, peak: "1.4K" },
  { name: "Tem", views: 40, unique: 22 },
  { name: "Ağu", views: 64, unique: 38 },
  { name: "Eyl", views: 76, unique: 44 },
  { name: "Eki", views: 88, unique: 52 },
  { name: "Kas", views: 60, unique: 34 },
  { name: "Ara", views: 72, unique: 40 },
];

const recentViewers = [
  { name: "Ayşe Demir", email: "ayse@modatekstil.com", time: "2 dk önce", depth: 92, live: true },
  { name: "Mehmet Kaya", email: "mehmet@kayainsaat.com", time: "18 dk önce", depth: 64 },
  { name: "Elif Şahin", email: "elif@nordicdesign.se", time: "1 sa önce", depth: 81 },
  { name: "Burak Öz", email: "burak@ozgroup.com.tr", time: "3 sa önce", depth: 37 },
];

const documents = [
  { title: "2026 İlkbahar Kataloğu", viewers: 142, avg: "5d 40s", status: "Aktif", updated: "28 Haz 2026" },
  { title: "Fiyat Listesi — Bayi", viewers: 96, avg: "3d 05s", status: "Aktif", updated: "24 Haz 2026" },
  { title: "Kurumsal Tanıtım Dosyası", viewers: 210, avg: "6d 22s", status: "Aktif", updated: "19 Haz 2026" },
  { title: "2025 Kış Kataloğu", viewers: 388, avg: "4d 51s", status: "Pasif", updated: "02 Oca 2026" },
];

function Icon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    doc: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    live: <circle cx="12" cy="12" r="5" />,
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
    chart: (
      <>
        <path d="M3 3v18h18" />
        <path d="M7 15v-4M12 15V7m5 8v-6" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
    export: (
      <>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <path d="M7 10l5 5 5-5M12 15V3" />
      </>
    ),
    dots: (
      <>
        <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

const navItems = [
  { label: "Panel", icon: "home", active: true },
  { label: "Dökümanlar", icon: "doc" },
  { label: "Kişiler", icon: "users" },
  { label: "Mail", icon: "mail" },
  { label: "Raporlar", icon: "chart" },
  { label: "Ayarlar", icon: "settings" },
];

export default function FrontPage() {
  const maxViews = Math.max(...months.map((m) => m.views));

  return (
    <div className="min-h-screen bg-[#e9eaee] p-3 md:p-6 font-sans text-ink">
      <div className="mx-auto max-w-[1400px] flex gap-4 md:gap-6">
        {/* ── Sol menü ── */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-surface rounded-[28px] p-6 self-start sticky top-6 min-h-[calc(100vh-3rem)]">
          <a href="/front" className="flex items-center gap-2.5 px-2 mb-10">
            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-ink text-surface">
              <Icon name="doc" className="w-4.5 h-4.5" />
            </span>
            <span className="font-display font-extrabold text-xl tracking-tight">Vitrin</span>
          </a>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => (
              <a
                key={item.label}
                href="/front"
                className={
                  item.active
                    ? "flex items-center gap-3 rounded-full bg-ink text-surface pl-2 pr-5 py-2 text-sm font-semibold"
                    : "flex items-center gap-3 rounded-full pl-2 pr-5 py-2 text-sm font-medium text-ink/55 hover:bg-surface-muted hover:text-ink transition-colors"
                }
              >
                <span
                  className={
                    item.active
                      ? "flex items-center justify-center w-8 h-8 rounded-full bg-surface/15"
                      : "flex items-center justify-center w-8 h-8 rounded-full bg-surface-muted"
                  }
                >
                  <Icon name={item.icon} />
                </span>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-10 flex items-center gap-3 px-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-ember/15 text-ember-dim font-display font-bold text-sm">
              HB
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">Hazal Barış</p>
              <p className="text-xs text-ink/45 truncate">comuniq&shy;creative@gmail.com</p>
            </div>
          </div>
        </aside>

        {/* ── Ana içerik ── */}
        <main className="flex-1 min-w-0 flex flex-col gap-4 md:gap-6">
          {/* Hızlı bakış kapsülleri */}
          <section className="bg-surface rounded-[28px] p-6 md:p-8">
            <div className="flex flex-col xl:flex-row gap-6 xl:items-center">
              <div className="xl:w-44 shrink-0">
                <h1 className="font-display font-extrabold text-2xl tracking-tight">Hızlı Bakış</h1>
                <p className="text-sm text-ink/45 mt-1">Son 7 günün özeti.</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 flex-1">
                {quickStats.map((s) => (
                  <div
                    key={s.label}
                    className={
                      s.dark
                        ? "rounded-[24px] bg-ink text-surface px-4 pt-6 pb-5 flex flex-col items-center text-center gap-3"
                        : "rounded-[24px] border border-rule px-4 pt-6 pb-5 flex flex-col items-center text-center gap-3 hover-lift"
                    }
                  >
                    <span
                      className={
                        s.dark
                          ? "relative flex items-center justify-center w-11 h-11 rounded-full bg-surface text-ink"
                          : "flex items-center justify-center w-11 h-11 rounded-full bg-surface-muted text-ink/70"
                      }
                    >
                      <Icon name={s.icon === "live" ? "eye" : s.icon} className="w-5 h-5" />
                      {s.dark && <span className="pulse-dot absolute -top-0.5 -right-0.5" />}
                    </span>
                    <div>
                      <p className="font-display font-extrabold text-2xl leading-none">{s.value}</p>
                      <p className={s.dark ? "text-xs mt-1.5 text-surface/60" : "text-xs mt-1.5 text-ink/45"}>
                        {s.label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4 md:gap-6">
            {/* Görüntülenme grafiği */}
            <section className="bg-surface rounded-[28px] p-6 md:p-8">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
                <h2 className="font-display font-extrabold text-xl tracking-tight">Görüntülenme</h2>
                <div className="flex items-center gap-5 text-xs font-medium text-ink/55">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-ink" /> Görüntülenme
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-surface-muted border border-rule" /> Tekil izleyici
                  </span>
                </div>
              </div>

              <div className="relative">
                {/* yatay kılavuz çizgileri */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {["1.5K", "1K", "500", "0"].map((y) => (
                    <div key={y} className="flex items-center gap-3">
                      <span className="w-8 text-right font-mono text-[10px] text-ink/30">{y}</span>
                      <div className="flex-1 border-t border-dashed border-rule" />
                    </div>
                  ))}
                </div>

                <div className="relative ml-11 h-52 flex items-end justify-between gap-1.5">
                  {months.map((m) => (
                    <div key={m.name} className="relative flex-1 flex items-end justify-center gap-[3px] h-full group">
                      {m.peak && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full bg-ink text-surface font-mono text-[10px] rounded-full px-2.5 py-1 whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink">
                          {m.peak}
                        </span>
                      )}
                      <div
                        className="w-2.5 rounded-full bg-ink group-hover:bg-signal transition-colors"
                        style={{ height: `${(m.views / maxViews) * 100}%` }}
                      />
                      <div
                        className="w-2.5 rounded-full bg-surface-muted"
                        style={{ height: `${(m.unique / maxViews) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="ml-11 mt-3 flex justify-between gap-1.5">
                  {months.map((m) => (
                    <span key={m.name} className="flex-1 text-center font-mono text-[10px] text-ink/40">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            {/* Son izleyiciler */}
            <section className="bg-surface rounded-[28px] p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display font-extrabold text-xl tracking-tight">Son İzleyiciler</h2>
                <button type="button" className="text-ink/35 hover:text-ink transition-colors" aria-label="Tümünü gör">
                  <Icon name="dots" className="w-5 h-5" />
                </button>
              </div>
              <ul className="flex flex-col gap-5">
                {recentViewers.map((v) => (
                  <li key={v.email} className="flex items-center gap-3">
                    <span className="relative flex items-center justify-center w-10 h-10 rounded-full bg-surface-muted font-display font-bold text-xs text-ink/70 shrink-0">
                      {v.name.split(" ").map((p) => p[0]).join("")}
                      {v.live && <span className="pulse-dot absolute -top-0.5 -right-0.5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{v.name}</p>
                      <p className="text-xs text-ink/45 truncate">{v.email} · {v.time}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface-muted font-mono text-[11px] px-2.5 py-1 text-ink/60">
                      %{v.depth}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 pt-5 border-t border-rule text-xs text-ink/40">
                Yüzde, izleyicinin dökümanın ne kadarını okuduğunu gösterir.
              </p>
            </section>
          </div>

          {/* Döküman tablosu */}
          <section className="bg-surface rounded-[28px] p-6 md:p-8">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
              <h2 className="font-display font-extrabold text-xl tracking-tight">Dökümanları Yönet</h2>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  className="rounded-full border border-rule px-4 py-2 text-sm font-medium text-ink/60 hover:border-ink/30 hover:text-ink transition-colors"
                >
                  Durum ▾
                </button>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-ink text-surface px-4 py-2 text-sm font-semibold hover:bg-ink-soft transition-colors"
                >
                  Dışa aktar <Icon name="export" className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px] border-separate border-spacing-y-1.5">
                <thead>
                  <tr className="text-left text-xs text-ink/40">
                    <th className="font-medium pb-3 pl-4">Döküman</th>
                    <th className="font-medium pb-3">İzleyici</th>
                    <th className="font-medium pb-3">Ort. süre</th>
                    <th className="font-medium pb-3">Durum</th>
                    <th className="font-medium pb-3">Güncelleme</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.title} className="group">
                      <td className="rounded-l-2xl bg-shell/60 group-hover:bg-surface-muted transition-colors p-4 font-semibold">
                        {d.title}
                      </td>
                      <td className="bg-shell/60 group-hover:bg-surface-muted transition-colors p-4 font-mono text-xs text-ink/60">
                        {d.viewers}
                      </td>
                      <td className="bg-shell/60 group-hover:bg-surface-muted transition-colors p-4 font-mono text-xs text-ink/60">
                        {d.avg}
                      </td>
                      <td className="bg-shell/60 group-hover:bg-surface-muted transition-colors p-4">
                        <span
                          className={
                            d.status === "Aktif"
                              ? "rounded-full bg-signal/10 text-signal-dim text-xs font-semibold px-3 py-1"
                              : "rounded-full bg-surface-muted text-ink/45 text-xs font-semibold px-3 py-1"
                          }
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="bg-shell/60 group-hover:bg-surface-muted transition-colors p-4 font-mono text-xs text-ink/50">
                        {d.updated}
                      </td>
                      <td className="rounded-r-2xl bg-shell/60 group-hover:bg-surface-muted transition-colors p-4 text-right">
                        <button type="button" className="text-ink/35 hover:text-ink transition-colors" aria-label="Döküman işlemleri">
                          <Icon name="dots" className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
