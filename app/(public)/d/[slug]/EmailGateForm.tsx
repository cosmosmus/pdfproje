"use client";

import { useState } from "react";

const T = {
  tr: {
    sub: "Bu belgeyi görüntülemek için e-posta adresinizi girin.",
    placeholder: "E-posta adresiniz",
    cta: "Görüntüle",
    loading: "Yükleniyor...",
    error: "Bir hata oluştu, tekrar deneyin.",
    lock: "Güvenli bağlantı",
  },
  en: {
    sub: "Enter your email address to view this document.",
    placeholder: "Your email address",
    cta: "View Document",
    loading: "Loading...",
    error: "Something went wrong, please try again.",
    lock: "Secure link",
  },
} as const;

export default function EmailGateForm({
  slug,
  title,
  locale = "tr",
  companyName,
  hasLogo,
}: {
  slug: string;
  title: string;
  locale?: "tr" | "en";
  companyName?: string | null;
  hasLogo?: boolean;
}) {
  const t = T[locale];
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/gate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, email }),
    });
    setLoading(false);
    if (!res.ok) { setError(t.error); return; }
    window.location.reload();
  }

  return (
    /* Arka plan: çok hafif teal mesh — kardan renk var, kart üzerinde kontrast sağlar */
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(14,169,155,0.09) 0%, transparent 70%), #f4f6f5",
      }}
    >
      {/* Kart */}
      <div className="w-full max-w-[520px] bg-white rounded-2xl shadow-xl shadow-black/[0.08] ring-1 ring-black/[0.05] px-8 py-10 flex flex-col items-center">

        {/* Logo */}
        {(hasLogo || companyName) && (
          <div className="mb-8">
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/api/branding/logo"
                alt={companyName ?? "Logo"}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <p className="font-display font-extrabold text-xl text-[#20232b] tracking-tight">
                {companyName}
              </p>
            )}
          </div>
        )}

        {/* İnce teal çizgi */}
        <div className="w-8 h-0.5 bg-[#0ea99b] rounded-full mb-6" />

        {/* Belge adı */}
        <h1
          className="font-display font-extrabold text-[#20232b] text-center leading-tight mb-3 break-words w-full"
          style={{ fontSize: "clamp(1.125rem, 3.5vw, 1.625rem)", wordBreak: "break-word", overflowWrap: "anywhere" }}
        >
          {title}
        </h1>
        <div className="flex items-center gap-2 mb-8">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#0ea99b] shrink-0">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          <p className="text-[0.8125rem] text-black/55 leading-relaxed font-medium">{t.sub}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.placeholder}
            required
            autoFocus
            className="w-full bg-[#F4F4F4] border border-transparent rounded-xl px-4 py-3.5 text-sm text-[#20232b] placeholder:text-black/30 focus:bg-white focus:border-[#0ea99b] focus:ring-4 focus:ring-[#0ea99b]/10 outline-none transition-all"
          />

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#20232b] hover:bg-[#2f3340] active:scale-[0.99] text-white font-semibold text-sm rounded-xl px-4 py-3.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? t.loading : (
              <>
                {t.cta}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </form>

        {/* Güvenlik notu */}
        <div className="flex items-center gap-1.5 mt-6">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-black/20 shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-mono text-[10px] text-black/25 tracking-wide">{t.lock}</span>
        </div>

      </div>
    </div>
  );
}
