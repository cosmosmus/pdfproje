"use client";

import { useRef, useState } from "react";

export type ContactGroup = "APP_MEMBER" | "UNKNOWN_CUSTOMER" | "CURRENT_CUSTOMER" | "POTENTIAL_CUSTOMER";

type Doc = { id: string; title: string; slug: string };
export type EmailEntry = {
  email: string;
  docTitle: string;
  group: ContactGroup;
};

type FilterTab = "ALL" | ContactGroup;

const TABS: { key: FilterTab; label: string }[] = [
  { key: "ALL", label: "Tümü" },
  { key: "APP_MEMBER", label: "App Üyesi" },
  { key: "UNKNOWN_CUSTOMER", label: "Tanınmayan" },
  { key: "CURRENT_CUSTOMER", label: "Cari" },
  { key: "POTENTIAL_CUSTOMER", label: "Potansiyel" },
];

export default function MailComposer({
  emails,
  documents,
  baseUrl,
}: {
  emails: EmailEntry[];
  documents: Doc[];
  baseUrl: string;
}) {
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [text, setText] = useState("");
  const [linkDocId, setLinkDocId] = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageFilename, setImageFilename] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const visibleEmails = activeTab === "ALL" ? emails : emails.filter((e) => e.group === activeTab);

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleEmails.forEach((e) => next.add(e.email));
      return next;
    });
  }
  function deselectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      visibleEmails.forEach((e) => next.delete(e.email));
      return next;
    });
  }
  const allVisibleSelected = visibleEmails.length > 0 && visibleEmails.every((e) => selected.has(e.email));

  function toggle(email: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(email) ? next.delete(email) : next.add(email);
      return next;
    });
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => setImageBase64(reader.result as string);
    reader.readAsDataURL(file);
  }

  const selectedDoc = documents.find((d) => d.id === linkDocId);
  const docLink = selectedDoc ? `${baseUrl}/d/${selectedDoc.slug}` : null;

  async function handleSend() {
    if (selected.size === 0) return alert("En az bir alıcı seçin.");
    if (!subject.trim()) return alert("Konu boş olamaz.");
    if (!text.trim()) return alert("Mesaj boş olamaz.");

    setSendStatus("sending");
    setResult(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: Array.from(selected),
          subject,
          text,
          imageBase64: imageBase64 ?? undefined,
          docLink: docLink ?? undefined,
          docTitle: selectedDoc?.title ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? "Hata oluştu"); setSendStatus("error"); return; }
      setResult(data);
      setSendStatus("done");
    } catch {
      setSendStatus("error");
      setErrorMsg("Bağlantı hatası.");
    }
  }

  const countByGroup = (g: ContactGroup) => emails.filter((e) => e.group === g).length;

  return (
    <div className="grid lg:grid-cols-[360px_1fr] gap-6">

      {/* Sol: Alıcı listesi */}
      <div className="bg-surface border border-rule rounded-2xl overflow-hidden self-start">

        {/* Grup sekmeleri */}
        <div className="flex overflow-x-auto border-b border-rule bg-surface-muted">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.key
                  ? "border-signal text-signal bg-surface"
                  : "border-transparent text-ink/40 hover:text-ink"
              }`}
            >
              {tab.label}
              {tab.key !== "ALL" && (
                <span className="ml-1 text-ink/30">({countByGroup(tab.key as ContactGroup)})</span>
              )}
            </button>
          ))}
        </div>

        {/* Seç/kaldır */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-rule">
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/40">
            {selected.size} seçili / {emails.length} toplam
          </p>
          <button
            type="button"
            onClick={allVisibleSelected ? deselectVisible : selectVisible}
            className="font-mono text-[10px] uppercase tracking-wide text-signal hover:text-signal-dim transition-colors"
          >
            {allVisibleSelected ? "Görünenleri Kaldır" : "Görünenleri Seç"}
          </button>
        </div>

        {/* Liste */}
        <div className="max-h-[500px] overflow-y-auto divide-y divide-rule">
          {visibleEmails.length === 0 ? (
            <p className="p-4 text-sm text-ink/40">Bu grupta kimse yok.</p>
          ) : (
            visibleEmails.map(({ email, docTitle }) => (
              <div key={email} className="px-4 py-3 hover:bg-surface-muted transition-colors">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(email)}
                    onChange={() => toggle(email)}
                    className="accent-signal shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">{email}</p>
                    <p className="text-xs text-ink/40 truncate">{docTitle}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sağ: Compose */}
      <div className="bg-surface border border-rule rounded-2xl p-6 flex flex-col gap-5">

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50 mb-1.5">Konu</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Mail konusu"
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:ring-2 focus:ring-signal/10 outline-none transition-all"
          />
        </div>

        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50 mb-1.5">Mesaj</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mail içeriğini buraya yazın..."
            rows={7}
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-sm text-ink placeholder:text-ink/30 focus:border-signal focus:ring-2 focus:ring-signal/10 outline-none transition-all resize-none"
          />
        </div>

        {/* Döküman linki */}
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50 mb-1.5">
            Döküman Linki <span className="normal-case text-ink/30">(opsiyonel)</span>
          </label>
          <select
            value={linkDocId}
            onChange={(e) => setLinkDocId(e.target.value)}
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-sm text-ink focus:border-signal focus:ring-2 focus:ring-signal/10 outline-none transition-all"
          >
            <option value="">— Link ekleme —</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>{doc.title}</option>
            ))}
          </select>
          {docLink && (
            <p className="mt-1.5 text-xs text-signal font-mono bg-signal/5 border border-signal/20 rounded-lg px-3 py-2 truncate">
              {docLink}
            </p>
          )}
        </div>

        {/* Görsel */}
        <div>
          <label className="block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/50 mb-1.5">
            Görsel <span className="normal-case text-ink/30">(opsiyonel)</span>
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => imageRef.current?.click()}
              className="font-mono text-xs uppercase tracking-wide border border-rule rounded-lg px-3 py-2 text-ink/60 hover:border-signal hover:text-signal hover:bg-surface-muted transition-colors"
            >
              Görsel Seç
            </button>
            {imageFilename && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink/60 truncate max-w-[160px]">{imageFilename}</span>
                <button
                  type="button"
                  onClick={() => { setImageBase64(null); setImageFilename(null); if (imageRef.current) imageRef.current.value = ""; }}
                  className="text-ink/30 hover:text-danger transition-colors text-sm leading-none"
                >×</button>
              </div>
            )}
            {imageBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageBase64} alt="Önizleme" className="h-10 w-auto rounded border border-rule" />
            )}
          </div>
          <input ref={imageRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
        </div>

        {/* Gönder */}
        <div className="flex items-center gap-4 pt-1">
          <button
            type="button"
            onClick={handleSend}
            disabled={sendStatus === "sending" || selected.size === 0}
            className="bg-signal hover:bg-signal-dim text-white font-semibold text-sm rounded-xl px-6 py-3 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {sendStatus === "sending" ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                Gönderiliyor…
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
                </svg>
                {selected.size} Kişiye Gönder
              </>
            )}
          </button>

          {sendStatus === "done" && result && (
            <p className="text-sm text-signal font-medium">
              ✓ {result.sent} mail gönderildi{result.failed > 0 ? `, ${result.failed} başarısız` : ""}
            </p>
          )}
          {sendStatus === "error" && (
            <p className="text-sm text-danger">{errorMsg ?? "Gönderim sırasında hata oluştu."}</p>
          )}
        </div>
      </div>
    </div>
  );
}
