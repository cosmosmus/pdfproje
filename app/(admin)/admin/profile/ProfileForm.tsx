"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconCheck } from "../_components/icons";

export default function ProfileForm({ currentEmail }: { currentEmail: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(currentEmail);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("Yeni şifreler eşleşmiyor");
      return;
    }

    setStatus("saving");
    const res = await fetch("/api/admin/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword,
        newEmail: email !== currentEmail ? email : undefined,
        newPassword: newPassword || undefined,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setStatus("error");
      setError(body.error ?? "Güncellenemedi");
      return;
    }

    setStatus("saved");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    router.refresh();
    setTimeout(() => setStatus("idle"), 3000);
  }

  const inputClass =
    "w-full bg-shell border border-rule rounded-lg px-4 py-2.5 placeholder:text-ink/30 focus:border-signal outline-none transition-colors";
  const labelClass = "block font-mono text-[11px] uppercase tracking-[0.08em] text-ink/40 mb-1.5";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-surface border border-rule rounded-2xl p-6 space-y-5"
    >
      <div>
        <label className={labelClass}>E-posta</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <hr className="border-rule" />

      <div>
        <label className={labelClass}>Yeni Şifre (opsiyonel)</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Değiştirmek istemiyorsan boş bırak"
          className={inputClass}
        />
      </div>

      {newPassword && (
        <div>
          <label className={labelClass}>Yeni Şifre (tekrar)</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      <hr className="border-rule" />

      <div>
        <label className={labelClass}>Mevcut Şifre</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          placeholder="Değişiklikleri onaylamak için gerekli"
          className={inputClass}
        />
      </div>

      {error && <p className="text-danger text-sm">{error}</p>}
      {status === "saved" && <p className="text-signal text-sm">Kaydedildi ✓</p>}

      <button
        type="submit"
        disabled={status === "saving"}
        className="w-full flex items-center justify-center gap-2 bg-signal text-white font-bold rounded-lg px-3 py-3 hover:bg-signal-dim transition-colors disabled:opacity-50"
      >
        <IconCheck className="w-4 h-4" />
        {status === "saving" ? "Kaydediliyor..." : "Kaydet"}
      </button>
    </form>
  );
}
