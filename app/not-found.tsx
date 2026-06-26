import { headers } from "next/headers";
import { prisma } from "@/lib/db";

const T = {
  tr: {
    eyebrow: "404",
    h1: "Bu sayfa mevcut değil",
    sub: "Aradığınız belge kaldırılmış ya da bu bağlantı artık geçerli değil.",
    contact: "İletişime Geçin",
  },
  en: {
    eyebrow: "404",
    h1: "This page doesn't exist",
    sub: "The document you're looking for may have been removed, or this link is no longer valid.",
    contact: "Get in Touch",
  },
} as const;

/* Kısa etiket + ikon + href döndüren yardımcı */
function contactLinks(c: NonNullable<Awaited<ReturnType<typeof fetchContact>>>) {
  const items: { label: string; href: string; color: string; icon: React.ReactNode }[] = [];

  if (c.contactEmail)
    items.push({
      label: "E-posta",
      href: `mailto:${c.contactEmail}`,
      color: "#0ea99b",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      ),
    });

  if (c.contactPhone)
    items.push({
      label: "Telefon",
      href: `tel:${c.contactPhone}`,
      color: "#da7756",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.57 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18z" />
        </svg>
      ),
    });

  if (c.contactWhatsapp)
    items.push({
      label: "WhatsApp",
      href: `https://wa.me/${c.contactWhatsapp.replace(/[^0-9]/g, "")}`,
      color: "#25d366",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.6.9-.8 1-.1.2-.3.2-.6.1-.7-.3-1.5-.8-2.1-1.4-.6-.6-1.1-1.3-1.5-2-.1-.3 0-.5.1-.6l.5-.6c.1-.2.1-.4 0-.6-.1-.2-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.5.1 1.1.6 2.2 1.4 3.2 1.6 2 3.5 3.4 5.8 4.1 1.1.4 2 .2 2.7-.1.6-.3 1.1-.9 1.3-1.6.1-.3.1-.6 0-.7-.1-.1-.3-.2-.5-.3z" />
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.3a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
        </svg>
      ),
    });

  if (c.contactInstagram)
    items.push({
      label: "Instagram",
      href: c.contactInstagram.startsWith("http")
        ? c.contactInstagram
        : `https://instagram.com/${c.contactInstagram.replace(/^@/, "")}`,
      color: "#e1306c",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      ),
    });

  if (c.contactLinkedin)
    items.push({
      label: "LinkedIn",
      href: c.contactLinkedin,
      color: "#0a66c2",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      ),
    });

  if (c.websiteUrl)
    items.push({
      label: "Website",
      href: c.websiteUrl,
      color: "#6b7280",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      ),
    });

  return items;
}

async function fetchContact() {
  return prisma.adminUser.findFirst({
    select: {
      companyName: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      contactInstagram: true,
      contactLinkedin: true,
      websiteUrl: true,
      logoStorageKey: true,
    },
  });
}

export default async function NotFound() {
  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  const locale: "tr" | "en" = /\btr\b/i.test(acceptLang) ? "tr" : "en";
  const t = T[locale];

  const contact = await fetchContact();
  const items = contact ? contactLinks(contact) : [];

  return (
    <div className="min-h-screen bg-shell flex flex-col">
      {/* Topbar */}
      <div className="border-b border-rule bg-surface px-6 h-14 flex items-center">
        {contact?.logoStorageKey ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="/api/branding/logo"
            alt={contact.companyName ?? "Logo"}
            className="h-7 w-auto object-contain"
          />
        ) : contact?.companyName ? (
          <span className="font-display font-extrabold text-base">{contact.companyName}</span>
        ) : (
          <span className="font-mono text-xs text-ink/30 uppercase tracking-widest">Vitrin</span>
        )}
      </div>

      {/* İçerik — mobilde tek kolon, lg'de iki kolon */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">

        {/* Sol: görsel — uzay görseline uygun koyu arka plan */}
        <div className="bg-[#080c18] border-b lg:border-b-0 lg:border-r border-white/5 min-h-[340px] lg:min-h-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/decosit-404.png"
            alt="404"
            className="w-full h-full object-cover object-center select-none block"
            style={{ minHeight: "340px" }}
          />
        </div>

        {/* Sağ: mesaj + iletişim */}
        <div className="flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-sm flex flex-col gap-8">

            {/* Mesaj */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink/30 mb-3">{t.eyebrow}</p>
              <h1 className="font-display font-extrabold text-4xl text-ink mb-4 leading-tight">{t.h1}</h1>
              <p className="text-[0.9375rem] text-ink/50 leading-relaxed">{t.sub}</p>
            </div>

            {/* İletişim */}
            {items.length > 0 && (
              <div className="bg-surface border border-rule rounded-2xl overflow-hidden">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35 text-center py-3.5 border-b border-rule">
                  {t.contact}
                </p>
                <div className="p-3 grid grid-cols-2 gap-1.5">
                  {items.map(({ label, href, color, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl hover:bg-shell transition-colors group"
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ backgroundColor: `${color}18`, color }}
                      >
                        {icon}
                      </span>
                      <span className="text-sm font-medium text-ink/70 group-hover:text-ink transition-colors">
                        {label}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
