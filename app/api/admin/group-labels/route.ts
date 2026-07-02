import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const schema = z.object({
  labelAppMember: z.string().max(40).optional(),
  labelUnknownCustomer: z.string().max(40).optional(),
  labelCurrentCustomer: z.string().max(40).optional(),
  labelPotentialCustomer: z.string().max(40).optional(),
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
    Object.entries(parsed.data).map(([k, v]) => [k, v?.trim() ? v.trim() : null])
  );

  await prisma.adminUser.update({ where: { email }, data });
  return NextResponse.json({ ok: true });
}
