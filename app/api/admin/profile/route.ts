import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/admin-session";
import { adminProfileUpdateSchema } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const currentEmail = await requireAdmin();
  if (!currentEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminProfileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Geçersiz bilgi" }, { status: 400 });
  }

  const { currentPassword, newEmail, newPassword } = parsed.data;
  const adminUser = await prisma.adminUser.findUnique({ where: { email: currentEmail } });
  if (!adminUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const valid = await bcrypt.compare(currentPassword, adminUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Mevcut şifre yanlış" }, { status: 401 });
  }

  if (!newEmail && !newPassword) {
    return NextResponse.json({ error: "Değiştirilecek bir alan girin" }, { status: 400 });
  }

  let updated;
  try {
    updated = await prisma.adminUser.update({
      where: { id: adminUser.id },
      data: {
        ...(newEmail ? { email: newEmail } : {}),
        ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "Bu e-posta zaten kullanılıyor" }, { status: 409 });
  }

  const response = NextResponse.json({ ok: true, email: updated.email });
  const token = await signAdminSession(updated.email);
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}
