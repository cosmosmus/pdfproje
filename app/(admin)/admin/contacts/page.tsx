import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import ContactsTable, { type ContactRow } from "./ContactsTable";
import { resolveGroupLabels } from "@/lib/group-labels";

export default async function ContactsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const [sessions, contacts, adminUser] = await Promise.all([
    prisma.viewerSession.findMany({
      select: { email: true, documentId: true, firstSeenAt: true },
      orderBy: { firstSeenAt: "desc" },
    }),
    prisma.contact.findMany({ select: { email: true, group: true } }),
    prisma.adminUser.findUnique({
      where: { email: admin },
      select: {
        labelAppMember: true,
        labelUnknownCustomer: true,
        labelCurrentCustomer: true,
        labelPotentialCustomer: true,
      },
    }),
  ]);

  const groupLabels = resolveGroupLabels(adminUser);

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
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">Kişiler</h1>
        <p className="text-sm text-ink/45 mt-0.5">
          Dökümanlarını görüntüleyen kişilere grup ata.
        </p>
      </div>
      <ContactsTable rows={rows} groupLabels={groupLabels} />
    </div>
  );
}
