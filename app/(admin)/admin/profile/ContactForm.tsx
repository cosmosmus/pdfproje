"use client";

import { useState } from "react";
import { IconCheck } from "../_components/icons";

type ContactData = {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactInstagram: string;
  contactLinkedin: string;
  websiteUrl: string;
};

export default function ContactForm({ initial }: { initial: ContactData }) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  function set(field: keyof ContactData) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("saving");
    const res = await fetch("/api/admin/branding/contact", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Kaydedilemedi");
      return;
    }
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 3000);
  }

  const inputClass =
    "w-full bg-shell border border-rule rounded-lg px-3.5 py-2.5 text-sm placeholder:text-ink/30 focus:border-signal outline-none transition-colors";
  const labelClass =
    "block font-mono text-[10px] uppercase tracking-[0.1em] text-ink/40 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="bg-surface border border-rule rounded-2xl p-6 space-y-4">

      {/* Firma adı — tam genişlik */}
      <div>
        <label className={labelClass}>Firma Adı</label>
        <input
          type="text"
          value={form.companyName}
          onChange={set("companyName")}
          placeholder="Firma Adı A.Ş."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>E-posta</label>
          <input
            type="email"
            value={form.contactEmail}
            onChange={set("contactEmail")}
            placeholder="info@firma.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Web Sitesi</label>
          <input
            type="url"
            value={form.websiteUrl}
            onChange={set("websiteUrl")}
            placeholder="https://firma.com"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Telefon</label>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={set("contactPhone")}
            placeholder="+90 555 000 00 00"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <input
            type="tel"
            value={form.contactWhatsapp}
            onChange={set("contactWhatsapp")}
            placeholder="905550000000"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Instagram</label>
          <input
            type="text"
            value={form.contactInstagram}
            onChange={set("contactInstagram")}
            placeholder="@firmaadi"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>LinkedIn</label>
          <input
            type="url"
            value={form.contactLinkedin}
            onChange={set("contactLinkedin")}
            placeholder="https://linkedin.com/company/..."
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      {status === "saved" && <p className="text-signal text-sm">Kaydedildi ✓</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full flex items-center justify-center gap-2 bg-signal text-white font-bold rounded-lg px-3 py-2.5 text-sm hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        <IconCheck className="w-4 h-4" />
        {status === "saving" ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
