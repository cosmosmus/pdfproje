import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import MailComposer, { type EmailEntry } from "./MailComposer";

export default async function MailPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = process.env.NODE_ENV === "production" ? "https" : "http";
  const baseUrl = `${proto}://${host}`;

  const [sessions, documents, contacts] = await Promise.all([
    prisma.viewerSession.findMany({
      select: { email: true, documentId: true },
      orderBy: { firstSeenAt: "desc" },
    }),
    prisma.document.findMany({
      select: { id: true, title: true, slug: true },
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contact.findMany({ select: { email: true, group: true } }),
  ]);

  const docMap = new Map(documents.map((d) => [d.id, d.title]));
  const groupMap = new Map(contacts.map((c) => [c.email, c.group]));

  const seen = new Set<string>();
  const emails: EmailEntry[] = [];
  for (const s of sessions) {
    if (!seen.has(s.email)) {
      seen.add(s.email);
      emails.push({
        email: s.email,
        docTitle: docMap.get(s.documentId) ?? "—",
        group: (groupMap.get(s.email) as EmailEntry["group"]) ?? "UNKNOWN_CUSTOMER",
      });
    }
  }

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/40 mb-1">İletişim</p>
        <h1 className="font-display font-extrabold text-3xl">Toplu Mail</h1>
        <p className="text-sm text-ink/50 mt-1">
          Dökümanlarını görüntüleyen kişilere mail gönder.
        </p>
      </div>
      <MailComposer emails={emails} documents={documents} baseUrl={baseUrl} />
    </div>
  );
}
