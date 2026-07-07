"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

const FLUSH_INTERVAL_MS = 7_000;
const MAX_DURATION_MS = 120_000;

// Görünen sayfanın etrafında bu kadar sayfa render edilir; bir kez render
// edilen sayfa bellekte kalır (geri kaydırınca yeniden çizilmez).
const RENDER_AHEAD = 6;
const RENDER_BEHIND = 3;
// Sayfa boyutu öğrenilene kadar placeholder yüksekliği için A4 oranı.
const DEFAULT_ASPECT_RATIO = 1.414;

type Entry = { page: number; durationMs: number };

type ContactInfo = {
  companyName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactInstagram: string | null;
  contactLinkedin: string | null;
  websiteUrl: string | null;
  logoStorageKey: string | null;
} | null;

export default function PdfViewer({
  slug,
  title,
  pageCount,
  fileUrl,
  lastUpdated,
  contact,
  locale = "tr",
}: {
  slug: string;
  title: string;
  pageCount: number;
  fileUrl: string;
  lastUpdated?: string;
  contact?: ContactInfo;
  locale?: "tr" | "en";
}) {
  const [numPages, setNumPages] = useState(0);
  // Sayfa genişliği viewport'a bağlı: telefonda döndürme/yeniden boyutlandırmada da güncellenir
  const [pageWidth, setPageWidth] = useState(() =>
    typeof window !== "undefined" ? Math.min(window.innerWidth - 32, 900) : 760
  );
  // Kademeli render: yalnızca görünen sayfanın çevresindeki pencere çizilir,
  // çizilenler sette kalır. İlk yüklemede baştaki sayfalar hemen gelir,
  // gerisi kaydırdıkça (veya pdf.js arka planda indirdikçe) eklenir.
  const [renderWindowCenter, setRenderWindowCenter] = useState(1);
  const renderedPagesRef = useRef<Set<number>>(new Set());
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_ASPECT_RATIO);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const bufferRef = useRef<Entry[]>([]);
  const currentPageRef = useRef<number>(1);
  // Tab gizlenince null — "saat duruyor" sinyali
  const pageEnteredAtRef = useRef<number | null>(Date.now());
  const visitIdRef = useRef<string>(
    typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
  );

  // O ana kadar biriken süreyi buffer'a yaz, saati durdur
  function pauseClock() {
    if (pageEnteredAtRef.current === null) return;
    const elapsed = Date.now() - pageEnteredAtRef.current;
    if (elapsed > 0) {
      bufferRef.current.push({
        page: currentPageRef.current,
        durationMs: Math.min(elapsed, MAX_DURATION_MS),
      });
    }
    pageEnteredAtRef.current = null;
  }

  // Saati şu andan itibaren yeniden başlat
  function resumeClock() {
    pageEnteredAtRef.current = Date.now();
  }

  function bumpCurrentPage(page: number) {
    if (page === currentPageRef.current) return;
    if (pageEnteredAtRef.current !== null) {
      const elapsed = Date.now() - pageEnteredAtRef.current;
      bufferRef.current.push({
        page: currentPageRef.current,
        durationMs: Math.min(elapsed, MAX_DURATION_MS),
      });
      pageEnteredAtRef.current = Date.now();
    }
    currentPageRef.current = page;
  }

  function flush(useBeacon = false) {
    // Saat çalışıyorsa o ana kadar geçen süreyi de ekle
    if (pageEnteredAtRef.current !== null) {
      const elapsed = Date.now() - pageEnteredAtRef.current;
      if (elapsed > 0) {
        bufferRef.current.push({
          page: currentPageRef.current,
          durationMs: Math.min(elapsed, MAX_DURATION_MS),
        });
        pageEnteredAtRef.current = Date.now();
      }
    }

    if (bufferRef.current.length === 0) return;
    const entries = bufferRef.current;
    bufferRef.current = [];
    const payload = JSON.stringify({
      slug,
      visitId: visitIdRef.current,
      referrer: document.referrer || undefined,
      entries,
    });

    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([payload], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  useEffect(() => {
    function onResize() {
      setPageWidth(Math.min(window.innerWidth - 32, 900));
    }
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    const ratios = new Map<number, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.pageNumber);
          ratios.set(page, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let mostVisible: { page: number; ratio: number } | null = null;
        for (const [page, ratio] of ratios) {
          if (!mostVisible || ratio > mostVisible.ratio) {
            mostVisible = { page, ratio };
          }
        }
        if (mostVisible && mostVisible.ratio > 0) {
          bumpCurrentPage(mostVisible.page);
          setRenderWindowCenter(mostVisible.page);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    pageRefs.current.forEach((el) => observer.observe(el));

    const interval = setInterval(() => flush(false), FLUSH_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") {
        pauseClock();
        flush(true);
      } else {
        resumeClock();
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", () => { pauseClock(); flush(true); });

    return () => {
      observer.disconnect();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numPages]);

  const hasContact = Boolean(
    contact?.contactEmail || contact?.contactPhone || contact?.contactWhatsapp ||
    contact?.websiteUrl || contact?.contactInstagram || contact?.contactLinkedin
  );

  return (
    <div className="min-h-screen bg-[#404040] flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-20 bg-[#2b2b2b]/95 backdrop-blur-sm border-b border-white/10">
        <div className="relative flex items-center justify-between px-4 h-12">
          {/* Sol: iletişim butonları */}
          <div className="flex items-center gap-1">
            {contact?.contactEmail && (
              <a
                href={`mailto:${contact.contactEmail}`}
                title={contact.contactEmail}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="hidden sm:inline">E-posta</span>
              </a>
            )}
            {contact?.contactWhatsapp && (
              <a
                href={`https://wa.me/${contact.contactWhatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                title="WhatsApp"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[#25d366] hover:text-[#25d366] hover:bg-white/10 transition-colors text-xs font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.6.9-.8 1-.1.2-.3.2-.6.1-.7-.3-1.5-.8-2.1-1.4-.6-.6-1.1-1.3-1.5-2-.1-.3 0-.5.1-.6l.5-.6c.1-.2.1-.4 0-.6-.1-.2-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.5.1 1.1.6 2.2 1.4 3.2 1.6 2 3.5 3.4 5.8 4.1 1.1.4 2 .2 2.7-.1.6-.3 1.1-.9 1.3-1.6.1-.3.1-.6 0-.7-.1-.1-.3-.2-.5-.3z" />
                  <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.3a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
                </svg>
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
            {contact?.contactPhone && !contact?.contactWhatsapp && (
              <a
                href={`tel:${contact.contactPhone}`}
                title={contact.contactPhone}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.57 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18z" />
                </svg>
                <span className="hidden sm:inline">Telefon</span>
              </a>
            )}
            {contact?.websiteUrl && (
              <a
                href={contact.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={contact.websiteUrl}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs font-medium"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span className="hidden sm:inline">Website</span>
              </a>
            )}
          </div>

          {/* Ortada: logo veya firma adı */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            {contact?.logoStorageKey ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/api/branding/logo"
                alt={contact.companyName ?? "Logo"}
                className="h-7 w-auto max-w-[160px] object-contain brightness-0 invert"
              />
            ) : contact?.companyName ? (
              <span className="font-display font-bold text-sm text-white/90 tracking-tight">
                {contact.companyName}
              </span>
            ) : (
              <span className="font-mono text-xs text-white/30 tracking-wider uppercase">{title}</span>
            )}
          </div>

          {/* Sağ: sayfa sayısı bilgisi */}
          <div className="text-right">
            {lastUpdated && (
              <p className="font-mono text-[10px] text-white/30 hidden sm:block">
                {lastUpdated}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* PDF sayfaları — seamless */}
      <div className="flex flex-col items-center py-8">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex items-center justify-center h-64">
              <span
                role="status"
                aria-label="Loading"
                className="w-10 h-10 rounded-full border-[3px] border-white/15 border-t-white/70 animate-spin"
              />
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
            const inWindow =
              pageNumber >= renderWindowCenter - RENDER_BEHIND &&
              pageNumber <= renderWindowCenter + RENDER_AHEAD;
            if (inWindow) renderedPagesRef.current.add(pageNumber);
            const shouldRender = renderedPagesRef.current.has(pageNumber);
            return (
              <div
                key={pageNumber}
                data-page-number={pageNumber}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNumber, el);
                }}
                className="shadow-2xl shadow-black/50 mb-8 last:mb-0"
              >
                {shouldRender ? (
                  <Page
                    pageNumber={pageNumber}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={pageWidth}
                    onLoadSuccess={(page) => {
                      const ratio = page.height / page.width;
                      if (pageNumber === 1 && Number.isFinite(ratio) && ratio > 0) {
                        setAspectRatio(ratio);
                      }
                    }}
                  />
                ) : (
                  // Henüz render edilmemiş sayfa: gerçek boyutlu iskelet —
                  // scroll yüksekliği sabit kalır, görünüme yaklaşınca çizilir.
                  <div
                    className="bg-white/5 flex items-center justify-center"
                    style={{ width: pageWidth, height: Math.round(pageWidth * aspectRatio) }}
                  >
                    <span className="font-mono text-xs text-white/20">{pageNumber}</span>
                  </div>
                )}
              </div>
            );
          })}
        </Document>
      </div>

      {/* Alt iletişim bandı */}
      {hasContact && (
        <div className="bg-[#2b2b2b] border-t border-white/10 py-5 px-6">
          <div className="max-w-2xl mx-auto flex flex-wrap items-center justify-center gap-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/30 w-full text-center mb-1">
              {locale === "tr" ? "İletişim" : "Contact"}
            </p>
            {contact?.contactEmail && (
              <a
                href={`mailto:${contact.contactEmail}`}
                title={contact.contactEmail}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                E-posta
              </a>
            )}
            {contact?.contactWhatsapp && (
              <a
                href={`https://wa.me/${contact.contactWhatsapp.replace(/[^0-9]/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25d366]/10 hover:bg-[#25d366]/20 border border-[#25d366]/20 text-[#25d366] transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.6.9-.8 1-.1.2-.3.2-.6.1-.7-.3-1.5-.8-2.1-1.4-.6-.6-1.1-1.3-1.5-2-.1-.3 0-.5.1-.6l.5-.6c.1-.2.1-.4 0-.6-.1-.2-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.5.1 1.1.6 2.2 1.4 3.2 1.6 2 3.5 3.4 5.8 4.1 1.1.4 2 .2 2.7-.1.6-.3 1.1-.9 1.3-1.6.1-.3.1-.6 0-.7-.1-.1-.3-.2-.5-.3z" />
                  <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.3a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
                </svg>
                WhatsApp
              </a>
            )}
            {contact?.contactPhone && (
              <a
                href={`tel:${contact.contactPhone}`}
                title={contact.contactPhone}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.61 4.9 2 2 0 0 1 3.57 3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.6a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 18z" />
                </svg>
                Telefon
              </a>
            )}
            {contact?.contactInstagram && (
              <a
                href={
                  contact.contactInstagram.startsWith("http")
                    ? contact.contactInstagram
                    : `https://instagram.com/${contact.contactInstagram.replace(/^@/, "")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e1306c]/10 hover:bg-[#e1306c]/20 border border-[#e1306c]/20 text-[#e1306c] transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                Instagram
              </a>
            )}
            {contact?.contactLinkedin && (
              <a
                href={contact.contactLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0a66c2]/10 hover:bg-[#0a66c2]/20 border border-[#0a66c2]/20 text-[#0a66c2] transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
                LinkedIn
              </a>
            )}
            {contact?.websiteUrl && (
              <a
                href={contact.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={contact.websiteUrl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors text-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                Website
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
