"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconLogin } from "../_components/icons";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Şifreler eşleşmiyor");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Kayıt başarısız, tekrar deneyin");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-16 sm:mt-24">
      <p className="text-sm font-medium text-ink/45 text-center mb-3">
        Yeni hesap
      </p>
      <div className="bg-surface rounded-[28px] p-8 shadow-xl shadow-black/5">
        <h1 className="font-display font-extrabold text-2xl tracking-tight mb-6 text-center">Kayıt ol</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Şifre (tekrar)"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            required
            minLength={6}
            className="w-full bg-shell border border-rule rounded-xl px-4 py-3 text-ink placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-ink text-surface font-semibold rounded-full px-3 py-3 hover:bg-ink-soft transition-colors disabled:opacity-50"
          >
            <IconLogin className="w-4 h-4" />
            {loading ? "Kayıt yapılıyor..." : "Kayıt ol"}
          </button>
        </form>
        <p className="text-sm text-ink/45 text-center mt-6">
          Zaten hesabın var mı?{" "}
          <Link href="/admin/login" className="font-semibold text-ink hover:text-signal transition-colors">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
