import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";

// ————————————————————————————————————————————————————————————
// İkonlar — bu sayfaya özel, mevcut ikon stiliyle (feather, 2px stroke) uyumlu.
// ————————————————————————————————————————————————————————————
type IconProps = { className?: string };

function IconUploadCloud({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 16l-4-4-4 4" />
      <path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function IconLink({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function IconLock({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconRadar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 2a10 10 0 1 0 10 10" />
      <path d="M12 2v10l6.5-3.5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconMapPinChart({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function IconGear({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconChevron({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// ————————————————————————————————————————————————————————————
// Küçük yapı taşları
// ————————————————————————————————————————————————————————————

const STOPS = [
  { n: 1, href: "#yukle", label: "Yükle", Icon: IconUploadCloud },
  { n: 2, href: "#paylas", label: "Paylaş", Icon: IconLink },
  { n: 3, href: "#kapi", label: "Kapı", Icon: IconLock },
  { n: 4, href: "#izleniyor", label: "İzleniyor", Icon: IconRadar },
  { n: 5, href: "#analiz", label: "Analiz Et", Icon: IconMapPinChart },
  { n: 6, href: "#arka-plan", label: "Arka Plan", Icon: IconGear },
] as const;

function Stop({ n, href, label, Icon }: { n: number; href: string; label: string; Icon: (p: IconProps) => React.ReactNode }) {
  return (
    <a
      href={href}
      className="hover-lift group relative flex md:flex-col items-center gap-3 md:gap-2 bg-paper border border-rule-paper rounded-b-xl deckle-top px-5 pt-5 pb-4 md:w-[112px] md:text-center shrink-0"
    >
      <span className="absolute -top-3 -right-2 flex items-center justify-center w-7 h-7 rounded-full bg-ink text-paper font-mono text-[11px] font-bold rotate-6 shadow-sm shrink-0">
        {n}
      </span>
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-paper-dim text-ink-on-paper group-hover:bg-signal/15 group-hover:text-signal-dim transition-colors shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <span className="font-display font-bold text-sm text-ink-on-paper">{label}</span>
    </a>
  );
}

function Section({
  id,
  n,
  title,
  Icon,
  children,
}: {
  id: string;
  n: number;
  title: string;
  Icon: (p: IconProps) => React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="hover-lift bg-surface rounded-[28px] p-6 md:p-8 scroll-mt-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-muted text-ink/70 font-mono text-xs font-bold shrink-0">
          {n}
        </span>
        <span className="flex items-center justify-center w-10 h-10 rounded-full bg-ink text-surface shrink-0">
          <Icon className="w-4.5 h-4.5" />
        </span>
        <h2 className="font-display font-extrabold text-xl tracking-tight text-ink">{title}</h2>
      </div>
      <div className="text-sm text-ink/70 leading-relaxed space-y-3 pl-[calc(2.5rem+0.75rem)]">
        {children}
      </div>
    </section>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs text-signal-dim bg-signal/5 border border-signal/20 rounded-xl px-4 py-3 leading-relaxed">
      {children}
    </p>
  );
}

// ————————————————————————————————————————————————————————————
// Sayfa
// ————————————————————————————————————————————————————————————

export default async function GuidePage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Özet: bu sistem ne işe yarar */}
      <section className="hover-lift bg-ink text-surface rounded-[28px] p-6 md:p-8">
        <p className="font-mono text-xs font-medium text-ember tracking-[0.14em] uppercase mb-3">Vitrin nedir</p>
        <h1 className="font-display font-extrabold text-2xl md:text-[1.75rem] tracking-tight mb-3 max-w-[600px] text-balance">
          Kimin, hangi sayfaya, ne kadar süre ve nereden baktığını gör
        </h1>
        <p className="text-sm text-surface/65 leading-relaxed max-w-[600px] mb-6">
          Vitrin bir katalog paylaşım ve okuyucu takip paneli. Bir PDF yüklüyorsun, tek bir link
          üretiliyor; o linki açan herkesin e-postasını, hangi sayfada ne kadar durduğunu, tahmini
          nereden baktığını ve ne zaman geri döndüğünü panelden görüyorsun. Aşağıdaki altı durak
          bu sürecin tamamını, adım adım anlatıyor.
        </p>
        <div className="flex flex-wrap gap-2">
          {["Link ile paylaş", "Sayfa bazlı okuma süresi", "Kim, nereden, ne zaman", "Canlı izleyiciler"].map((t) => (
            <span
              key={t}
              className="font-mono text-[11px] text-surface/70 bg-surface/10 border border-surface/15 rounded-full px-3 py-1.5"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Hero: belgenin yolculuğu */}
      <section className="hover-lift bg-surface rounded-[28px] p-6 md:p-8">
        <p className="font-mono text-xs font-medium text-ember tracking-[0.14em] uppercase mb-2">Panel Rehberi</p>
        <h2 className="font-display font-extrabold text-2xl md:text-[1.75rem] tracking-tight text-ink mb-2">
          Bir belgenin panelde izlediği yol
        </h2>
        <p className="text-sm text-ink/55 leading-relaxed max-w-[560px] mb-7">
          Bir PDF, senin bilgisayarından bir okuyucunun ekranına giderken altı duraktan geçer. Her durak,
          panelde bir bölüme karşılık gelir — aşağıda birine tıkla, o bölüme atlarsın.
        </p>

        <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-3 md:gap-2.5">
          {/* "contents" sarmalayıcıyı düzenden çıkarır; ok yalnızca masaüstünde
              görünür olduğu için mobilde ekstra boşluk/satır bırakmaz. */}
          {STOPS.map((s, i) => (
            <div key={s.href} className="contents">
              <Stop {...s} />
              {i < STOPS.length - 1 && (
                <IconChevron className="hidden md:block w-4 h-4 text-rule-paper shrink-0" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 1. Yükle */}
      <Section id="yukle" n={1} title="Yükle" Icon={IconUploadCloud}>
        <p>
          <strong className="text-ink">Yeni katalog ekle</strong> ile PDF&apos;ini seçtiğinde iki şey aynı anda olur: dosya
          doğrudan depolamaya gider (en fazla 200MB, büyük dosyalarda bile birkaç saniye sürer), sonra
          arka planda her sayfanın küçük bir önizlemesi hazırlanır.
        </p>
        <p>
          Bu önizlemeler yalnızca sen istatistik sayfasında bir sayfanın üzerine geldiğinde görünür —
          okuyucular hiç görmez, onlar PDF&apos;in aslını okur.
        </p>
        <p>
          Bir kataloğu güncellemek istediğinde (yeni fiyat, yeni sayfa) döküman satırındaki yenile
          ikonundan PDF&apos;i değiştirebilirsin. <strong className="text-ink">Link aynı kalır</strong> — daha önce
          paylaştığın adres bozulmaz, eski versiyonun istatistikleri de silinmez.
        </p>
        <Callout>
          İpucu: Döküman sayfasının üstündeki versiyon seçiciyle her zaman önceki bir sürümün
          istatistiklerine geri dönebilirsin.
        </Callout>
      </Section>

      {/* 2. Paylaş */}
      <Section id="paylas" n={2} title="Paylaş" Icon={IconLink}>
        <p>
          Her dökümanın yanında üç hızlı yol var: linki kopyala, mail ile gönder, WhatsApp ile gönder —
          üçü de panel ana sayfasındaki döküman satırından, tek tıkla.
        </p>
        <p>
          Daha çok kişiye aynı anda ulaşmak istersen <strong className="text-ink">Mail</strong> sekmesi var: Kişiler
          listenden grup seçip toplu mail atabilir, isteğe bağlı bir görsel ve döküman linki
          ekleyebilirsin.
        </p>
        <div className="grid sm:grid-cols-2 gap-3 pt-1">
          <div className="rounded-xl border border-rule bg-shell p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-ink/35 mb-2">Normal görünüm</p>
            <div className="bg-surface rounded-lg p-2.5 flex flex-col items-center gap-1.5">
              <span className="w-6 h-6 rounded-full bg-ink/10" />
              <span className="w-16 h-1.5 rounded-full bg-ink/10" />
              <span className="w-20 h-1.5 rounded-full bg-ink/10" />
              <span className="mt-1 w-14 h-4 rounded-full bg-ink/80" />
            </div>
            <p className="text-xs text-ink/45 mt-2">Logo + kart + buton. Şık, ama &quot;kampanya&quot; sinyali güçlü.</p>
          </div>
          <div className="rounded-xl border border-rule bg-shell p-3">
            <p className="font-mono text-[10px] uppercase tracking-wider text-signal-dim mb-2">Sade görünüm</p>
            <div className="bg-surface rounded-lg p-2.5 flex flex-col gap-1.5">
              <span className="w-24 h-1.5 rounded-full bg-ink/10" />
              <span className="w-20 h-1.5 rounded-full bg-ink/10" />
              <span className="w-16 h-1.5 rounded-full bg-signal/40" />
            </div>
            <p className="text-xs text-ink/45 mt-2">Düz metin, kişisel bir mektup gibi. Gelen Kutusu&apos;na düşme ihtimali daha yüksek.</p>
          </div>
        </div>
        <p>
          Mailin Gmail&apos;de doğrudan gelen kutusuna düşmesini istiyorsan gönderirken{" "}
          <strong className="text-ink">Sade görünüm</strong> kutusunu işaretle.
        </p>
      </Section>

      {/* 3. Kapı */}
      <Section id="kapi" n={3} title="Kapı" Icon={IconLock}>
        <p>
          Linke tıklayan biri PDF&apos;i hemen görmez — önce e-postasını yazması istenir. Bu bilinçli bir
          tasarım: kim baktığını bilmeden &quot;kim ne kadar baktı&quot; istatistiği tutamayız.
        </p>
        <p>
          Bir kere e-posta girildiğinde tarayıcı <strong className="text-ink">90 gün</strong> boyunca hatırlar — o kişi
          tekrar tekrar e-posta yazmaz, linke her tıkladığında direkt PDF&apos;i görür.
        </p>
        <p>
          Girilen her e-posta otomatik olarak <strong className="text-ink">Kişiler</strong> listene &quot;Tanınmayan
          Müşteri&quot; grubuyla düşer. Sen onu App Üyesi, Cari Müşteri veya Potansiyel Müşteri gruplarından
          birine taşıyabilirsin — bu yalnızca senin listeni düzenli tutman için, okuyucu bundan haberdar
          olmaz.
        </p>
      </Section>

      {/* 4. İzleniyor */}
      <Section id="izleniyor" n={4} title="İzleniyor" Icon={IconRadar}>
        <p>
          Biri PDF&apos;i açtığında panel üç şeyi kaydeder: hangi sayfada ne kadar durdu, tahmini konumu
          (IP&apos;den), hangi cihaz ve tarayıcıdan baktığı. Bunlar arka planda, okuyucunun hiç fark
          etmeyeceği şekilde toplanır.
        </p>
        <p className="flex items-center gap-2">
          <span className="pulse-dot shrink-0" />
          Panelin en üstündeki <strong className="text-ink">Canlı İzleyiciler</strong> kutusu, şu an gerçekten PDF&apos;e
          bakan kişileri gösterir — son 60 saniye içinde sinyal gelen ziyaretler &quot;canlı&quot; sayılır, 15
          saniyede bir tazelenir. Biri sayfayı kapatıp bir dakika geçtiğinde listeden düşer.
        </p>
      </Section>

      {/* 5. Analiz Et */}
      <Section id="analiz" n={5} title="Analiz Et" Icon={IconMapPinChart}>
        <p>
          Her dökümanın kendi istatistik sayfası var: toplam ziyaret, kaç farklı kişi baktı, ortalama ne
          kadar durdu, hangi sayfada okuyucular kopardı (drop-off grafiği), aylık trend.
        </p>
        <div className="rounded-xl border border-rule bg-shell p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="line-through text-ink/30 font-mono">İzmir · 5</span>
            <IconChevron className="w-3.5 h-3.5 text-ink/25" />
            <span className="text-signal-dim font-mono font-bold">İzmir · 1</span>
          </div>
          <p className="text-xs text-ink/45 flex-1">
            Haritadaki pinler <strong className="text-ink/70">kaç kere değil, kaç farklı kişi</strong> baktığını gösterir.
            Aynı kişi kataloğu 5 kere açsa bile pin sadece 1 artar.
          </p>
        </div>
        <p>
          Pine tıklayınca o ülkedeki şehirlere ayrılır. Konum tahmini IP&apos;ye dayanır; VPN veya kurumsal
          proxy kullanan biri gerçek olmayan bir ülkede görünebilir — bu her IP tabanlı sistemin doğal
          sınırıdır, %100 kesin değildir.
        </p>
        <p>
          Bir kişinin adına tıklarsan o kişinin tüm geçmişini görürsün: hangi tarihte, hangi versiyonu,
          ne kadar süreyle okudu.
        </p>
      </Section>

      {/* 6. Arka Plan */}
      <Section id="arka-plan" n={6} title="Arka Plan" Icon={IconGear}>
        <p>
          <strong className="text-ink">Profil</strong> sayfasından logonu, favicon&apos;unu, iletişim bilgilerini (bunlar
          okuyucunun gördüğü üst/alt bantta çıkar) ve Kişiler gruplarının isimlerini
          özelleştirebilirsin.
        </p>
        <p>
          Panelde birden fazla kişi çalışacaksa herkes kendi hesabını açabilir. Ama şunu bilerek: şu an
          hesaplar arasında bir ayrım yok, <strong className="text-ink">kayıt olan herkes tüm dökümanları ve
          istatistikleri görür</strong>. Küçük, birbirine güvenen bir ekip için tasarlandı.
        </p>
      </Section>
    </div>
  );
}
