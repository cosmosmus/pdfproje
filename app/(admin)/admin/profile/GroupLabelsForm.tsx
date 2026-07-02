"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "../_components/icons";
import { DEFAULT_GROUP_LABELS } from "@/lib/group-labels";

type LabelData = {
  labelAppMember: string;
  labelUnknownCustomer: string;
  labelCurrentCustomer: string;
  labelPotentialCustomer: string;
};

const FIELDS: { key: keyof LabelData; defaultLabel: string }[] = [
  { key: "labelAppMember", defaultLabel: DEFAULT_GROUP_LABELS.APP_MEMBER },
  { key: "labelUnknownCustomer", defaultLabel: DEFAULT_GROUP_LABELS.UNKNOWN_CUSTOMER },
  { key: "labelCurrentCustomer", defaultLabel: DEFAULT_GROUP_LABELS.CURRENT_CUSTOMER },
  { key: "labelPotentialCustomer", defaultLabel: DEFAULT_GROUP_LABELS.POTENTIAL_CUSTOMER },
];

export default function GroupLabelsForm({ initial }: { initial: LabelData }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("saving");
    const res = await fetch("/api/admin/group-labels", {
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
    router.refresh();
    setTimeout(() => setStatus("idle"), 3000);
  }

  const inputClass =
    "w-full bg-shell border border-rule rounded-xl px-3.5 py-2.5 text-sm placeholder:text-ink/30 focus:border-signal outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-[28px] p-6 md:p-8 space-y-4">
      <div>
        <h2 className="font-display font-extrabold text-xl tracking-tight">Grup İsimleri</h2>
        <p className="text-xs text-ink/40 mt-1">
          Kişiler ve Toplu Mail ekranlarındaki grup adlarını kendine göre değiştir. Boş
          bırakılan alanda varsayılan isim kullanılır.
        </p>
      </div>

      {FIELDS.map(({ key, defaultLabel }) => (
        <div key={key}>
          <label className="block text-xs font-medium text-ink/50 mb-1.5">
            Varsayılan: {defaultLabel}
          </label>
          <input
            type="text"
            value={form[key]}
            maxLength={40}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={defaultLabel}
            className={inputClass}
          />
        </div>
      ))}

      {error && <p className="text-danger text-sm">{error}</p>}
      {status === "saved" && <p className="text-signal text-sm">Kaydedildi ✓</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full flex items-center justify-center gap-2 bg-ink text-surface font-semibold rounded-full px-3 py-2.5 text-sm hover:bg-ink-soft transition-colors disabled:opacity-50"
      >
        <IconCheck className="w-4 h-4" />
        {status === "saving" ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
