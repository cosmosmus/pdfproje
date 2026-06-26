import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import LogoutButton from "./LogoutButton";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const admin = email
    ? await prisma.adminUser.findUnique({ where: { email }, select: { logoStorageKey: true } })
    : null;

  return (
    <div className="min-h-screen bg-shell text-ink">
      <div className="h-[3px] bg-gradient-to-r from-signal via-ember to-signal" />
      <header className="border-b border-rule bg-surface px-6 py-4 flex items-center justify-between">
        <a href="/admin" className="flex items-center gap-2.5">
          {admin?.logoStorageKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/api/branding/logo"
              alt="Logo"
              className="h-8 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <span className="font-display font-extrabold text-xl tracking-tight text-ink">
              Vitrin
            </span>
          )}
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40">
            kontrol odası
          </span>
        </a>
        {email && (
          <div className="flex items-center gap-5 font-mono text-xs uppercase tracking-[0.12em]">
            <a href="/admin/contacts" className="text-ink/50 hover:text-signal transition-colors">
              Kişiler
            </a>
            <a href="/admin/mail" className="text-ink/50 hover:text-signal transition-colors">
              Mail
            </a>
            <a href="/admin/profile" className="text-ink/50 hover:text-signal transition-colors">
              Profil
            </a>
            <LogoutButton />
          </div>
        )}
      </header>
      <main className="p-6 md:p-10 max-w-6xl mx-auto">{children}</main>
    </div>
  );
}
