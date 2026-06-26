import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { gateCookieName, verifyGateToken } from "@/lib/auth";
import EmailGateForm from "./EmailGateForm";
import PdfViewerLoader from "./PdfViewerLoader";

export default async function PublicDocumentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const headersList = await headers();
  const acceptLang = headersList.get("accept-language") ?? "";
  const locale: "tr" | "en" = /\btr\b/i.test(acceptLang) ? "tr" : "en";

  const [document, admin] = await Promise.all([
    prisma.document.findUnique({ where: { slug } }),
    prisma.adminUser.findFirst({
      select: {
        companyName: true,
        contactEmail: true,
        contactPhone: true,
        contactWhatsapp: true,
        contactInstagram: true,
        contactLinkedin: true,
        websiteUrl: true,
        logoStorageKey: true,
      },
    }),
  ]);

  if (!document || !document.isActive) {
    notFound();
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(gateCookieName(document.id))?.value;
  const gate = cookieValue ? await verifyGateToken(cookieValue, document.id) : null;

  if (!gate) {
    return (
      <EmailGateForm
        slug={slug}
        title={document.title}
        locale={locale}
        companyName={admin?.companyName ?? null}
        hasLogo={Boolean(admin?.logoStorageKey)}
      />
    );
  }

  return (
    <PdfViewerLoader
      slug={slug}
      title={document.title}
      pageCount={document.pageCount}
      fileUrl={`/api/documents/${slug}/file`}
      lastUpdated={document.updatedAt.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB")}
      contact={admin}
      locale={locale}
    />
  );
}
