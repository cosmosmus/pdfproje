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
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">Toplu Mail</h1>
        <p className="text-sm text-ink/45 mt-0.5">
          Dökümanlarını görüntüleyen kişilere mail gönder.
        </p>
      </div>
      <MailComposer emails={emails} documents={documents} baseUrl={baseUrl} />
    </div>
  );
}
