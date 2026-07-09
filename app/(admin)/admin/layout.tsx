import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import LogoutButton from "./LogoutButton";
import SidebarNav from "./_components/SidebarNav";

function Logo({ hasLogo }: { hasLogo: boolean }) {
  return (
    <a href="/admin" className="flex items-center gap-2.5">
      {hasLogo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/admin/branding/logo"
          alt="Logo"
          className="h-8 w-auto max-w-[140px] object-contain"
        />
      ) : (
        <>
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-ink text-surface">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6" />
            </svg>
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight text-ink">
            Vitrin
          </span>
        </>
      )}
    </a>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const email = await requireAdmin();
  const admin = email
    ? await prisma.adminUser.findUnique({ where: { email }, select: { logoStorageKey: true } })
    : null;

  if (!email) {
    return (
      <div className="min-h-screen bg-[#e9eaee] text-ink font-sans p-6">
        {children}
      </div>
    );
  }

  const initials = email.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#e9eaee] text-ink font-sans p-3 md:p-6">
      <div className="mx-auto max-w-[1400px] flex gap-4 md:gap-6 items-start">
        {/* Sol menü */}
        <aside className="dot-pattern hidden lg:flex flex-col w-60 shrink-0 bg-surface rounded-[28px] p-6 sticky top-6 min-h-[calc(100vh-3rem)]">
          <div className="px-2 mb-10">
            <Logo hasLogo={Boolean(admin?.logoStorageKey)} />
          </div>

          <SidebarNav />

          <div className="mt-auto pt-10 flex items-center gap-3 px-2">
            <span className="flex items-center justify-center w-10 h-10 rounded-full bg-ember/15 text-ember-dim font-display font-bold text-sm shrink-0">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{email}</p>
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Ana içerik */}
        <div className="flex-1 min-w-0">
          {/* Mobil üst bar */}
          <div className="lg:hidden bg-surface rounded-[28px] px-5 py-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
            <Logo hasLogo={Boolean(admin?.logoStorageKey)} />
            <SidebarNav horizontal />
          </div>

          <main className="min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
