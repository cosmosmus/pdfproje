import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { sendDocumentLinkEmail } from "@/lib/mailer";

const schema = z.object({ email: z.string().email() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçerli bir e-posta girin" }, { status: 400 });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Döküman bulunamadı" }, { status: 404 });
  }

  const link = `${request.nextUrl.origin}/doc/${document.slug}`;

  try {
    await sendDocumentLinkEmail({ to: parsed.data.email, documentTitle: document.title, link });
  } catch (err) {
    console.error("send-link email failed", err);
    return NextResponse.json(
      { error: "Mail gönderilemedi. SMTP ayarları yapılandırılmamış olabilir." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
