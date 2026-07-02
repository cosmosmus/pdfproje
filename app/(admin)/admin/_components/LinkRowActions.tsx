"use client";

import { useState } from "react";

export default function LinkRowActions({
  documentId,
  link,
}: {
  documentId: string;
  link: string;
}) {
  const [copied, setCopied] = useState(false);
  const [showMailForm, setShowMailForm] = useState(false);
  const [showWhatsappForm, setShowWhatsappForm] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const res = await fetch(`/api/admin/documents/${documentId}/send-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Gönderilemedi");
      return;
    }
    setStatus("sent");
    setEmail("");
    setTimeout(() => {
      setStatus("idle");
      setShowMailForm(false);
    }, 1500);
  }

  function handleSendWhatsapp(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/[^0-9]/g, "");
    if (!digits) return;
    const message = encodeURIComponent(`Döküman linki: ${link}`);
    window.open(`https://wa.me/${digits}?text=${message}`, "_blank");
    setShowWhatsappForm(false);
    setPhone("");
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      <span className="relative group">
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-full hover:bg-surface-muted text-ink/40 hover:text-signal transition-colors"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
        <span className="hidden group-hover:block absolute left-0 top-full pt-1 z-10">
          <a
            href={link}
            target="_blank"
            className="block bg-surface border border-rule rounded-lg shadow-xl shadow-black/10 px-3 py-1.5 font-mono text-xs text-signal hover:text-signal-dim whitespace-nowrap"
          >
            {link}
          </a>
        </span>
      </span>

      <button
        type="button"
        onClick={() => {
          setShowMailForm((s) => !s);
          setShowWhatsappForm(false);
        }}
        title="Mail ile gönder"
        className="p-1.5 rounded-full hover:bg-surface-muted text-ink/40 hover:text-signal transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => {
          setShowWhatsappForm((s) => !s);
          setShowMailForm(false);
        }}
        title="WhatsApp ile gönder"
        className="p-1.5 rounded-full hover:bg-surface-muted text-signal"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.5 14.4c-.3-.1-1.6-.8-1.9-.9-.3-.1-.4-.1-.6.1-.2.2-.6.9-.8 1-.1.2-.3.2-.6.1-.7-.3-1.5-.8-2.1-1.4-.6-.6-1.1-1.3-1.5-2-.1-.3 0-.5.1-.6l.5-.6c.1-.2.1-.4 0-.6-.1-.2-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.7.7-1 1.5-1 2.5.1 1.1.6 2.2 1.4 3.2 1.6 2 3.5 3.4 5.8 4.1 1.1.4 2 .2 2.7-.1.6-.3 1.1-.9 1.3-1.6.1-.3.1-.6 0-.7-.1-.1-.3-.2-.5-.3z" />
          <path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.3a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8.3 8.3 0 1 1 12 20.3z" />
        </svg>
      </button>

      {showMailForm && (
        <form
          onSubmit={handleSendEmail}
          className="absolute right-0 top-full mt-1 z-10 bg-surface border border-rule rounded-lg shadow-xl shadow-black/10 p-3 flex gap-2 w-72"
        >
          <input
            type="email"
            required
            autoFocus
            placeholder="alici@firma.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-shell border border-rule rounded px-2 py-1.5 text-sm placeholder:text-ink/30 focus:border-signal outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-signal text-ink rounded px-3 py-1.5 text-sm whitespace-nowrap disabled:opacity-50"
          >
            {status === "sending" ? "..." : status === "sent" ? "✓" : "Gönder"}
          </button>
          {error && <p className="absolute top-full left-0 mt-1 text-danger text-xs">{error}</p>}
        </form>
      )}

      {showWhatsappForm && (
        <form
          onSubmit={handleSendWhatsapp}
          className="absolute right-0 top-full mt-1 z-10 bg-surface border border-rule rounded-lg shadow-xl shadow-black/10 p-3 flex gap-2 w-72"
        >
          <input
            type="tel"
            required
            autoFocus
            placeholder="905xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 bg-shell border border-rule rounded px-2 py-1.5 text-sm placeholder:text-ink/30 focus:border-signal outline-none"
          />
          <button
            type="submit"
            className="bg-signal text-ink rounded px-3 py-1.5 text-sm whitespace-nowrap"
          >
            Aç
          </button>
        </form>
      )}
    </div>
  );
}
