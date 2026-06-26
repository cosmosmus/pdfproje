import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import ContactsTable, { type ContactRow } from "./ContactsTable";

export default async function ContactsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [sessions, contacts] = await Promise.all([
    prisma.viewerSession.findMany({
      select: { email: true, documentId: true, firstSeenAt: true },
      orderBy: { firstSeenAt: "desc" },
    }),
    prisma.contact.findMany({ select: { email: true, group: true } }),
  ]);

  const groupMap = new Map(contacts.map((c) => [c.email, c.group]));

  const seen = new Set<string>();
  const rows: ContactRow[] = [];
  for (const s of sessions) {
    if (!seen.has(s.email)) {
      seen.add(s.email);
      rows.push({
        email: s.email,
        group: (groupMap.get(s.email) ?? "UNKNOWN_CUSTOMER") as ContactRow["group"],
        firstSeen: s.firstSeenAt.toISOString(),
      });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40 mb-1">Yönetim</p>
        <h1 className="font-display font-extrabold text-3xl">Kişiler</h1>
        <p className="text-sm text-ink/50 mt-1">
          Dökümanlarını görüntüleyen kişilere grup ata.
        </p>
      </div>
      <ContactsTable rows={rows} />
    </div>
  );
}
