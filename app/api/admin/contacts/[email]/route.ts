import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const VALID_GROUPS = ["APP_MEMBER", "UNKNOWN_CUSTOMER", "CURRENT_CUSTOMER", "POTENTIAL_CUSTOMER"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await params;
  const decoded = decodeURIComponent(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(decoded) || decoded.length > 254) {
    return NextResponse.json({ error: "Geçersiz e-posta" }, { status: 400 });
  }
  const { group } = await request.json().catch(() => ({}));

  if (!VALID_GROUPS.includes(group)) {
    return NextResponse.json({ error: "Geçersiz grup" }, { status: 400 });
  }

  await prisma.contact.upsert({
    where: { email: decoded },
    update: { group },
    create: { email: decoded, group },
  });

  return NextResponse.json({ ok: true });
}
