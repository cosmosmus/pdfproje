import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const schema = z.object({
  companyName: z.string().max(100).optional(),
  contactEmail: z.string().email().max(200).or(z.literal("")).optional(),
  contactPhone: z.string().max(30).optional(),
  contactWhatsapp: z.string().max(30).optional(),
  contactInstagram: z.string().max(100).optional(),
  contactLinkedin: z.string().max(200).optional(),
  websiteUrl: z.string().url().max(200).or(z.literal("")).optional(),
});

export async function PATCH(request: NextRequest) {
  const email = await requireAdmin();
  if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz bilgi" }, { status: 400 });
  }

  const data = Object.fromEntries(
    Object.entries(parsed.data).map(([k, v]) => [k, v === "" ? null : v])
  );

  await prisma.adminUser.update({ where: { email }, data });
  return NextResponse.json({ ok: true });
}
