"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLogin } from "../_components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("E-posta veya şifre yanlış");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto mt-24">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40 text-center mb-3">
        Yetkili Girişi
      </p>
      <div className="bg-surface border border-rule rounded-2xl p-8 shadow-xl shadow-black/5">
        <h1 className="font-display font-extrabold text-2xl mb-6 text-center">Giriş yap</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-shell border border-rule rounded-lg px-4 py-3 text-ink placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-shell border border-rule rounded-lg px-4 py-3 text-ink placeholder:text-ink/30 focus:border-signal outline-none transition-colors"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-signal text-white font-bold rounded-lg px-3 py-3 hover:bg-signal-dim transition-colors disabled:opacity-50"
          >
            <IconLogin className="w-4 h-4" />
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
