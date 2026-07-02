"use client";

import { usePathname } from "next/navigation";

const items = [
  { label: "Panel", href: "/admin", icon: "home" },
  { label: "Kişiler", href: "/admin/contacts", icon: "users" },
  { label: "Mail", href: "/admin/mail", icon: "mail" },
  { label: "Profil", href: "/admin/profile", icon: "settings" },
];

function NavIcon({ name, className = "w-4 h-4" }: { name: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </>
    ),
    users: (
      <>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
}

export default function SidebarNav({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin" || pathname.startsWith("/admin/documents");
    }
    return pathname.startsWith(href);
  }

  return (
    <nav className={horizontal ? "flex items-center gap-1 overflow-x-auto" : "flex flex-col gap-1.5"}>
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <a
            key={item.href}
            href={item.href}
            className={
              active
                ? "flex items-center gap-3 rounded-full bg-ink text-surface pl-2 pr-5 py-2 text-sm font-semibold whitespace-nowrap"
                : "flex items-center gap-3 rounded-full pl-2 pr-5 py-2 text-sm font-medium text-ink/55 hover:bg-surface-muted hover:text-ink transition-colors whitespace-nowrap"
            }
          >
            <span
              className={
                active
                  ? "flex items-center justify-center w-8 h-8 rounded-full bg-surface/15 shrink-0"
                  : "flex items-center justify-center w-8 h-8 rounded-full bg-surface-muted shrink-0"
              }
            >
              <NavIcon name={item.icon} />
            </span>
            {item.label}
          </a>
        );
      })}
    </nav>
  );
}
