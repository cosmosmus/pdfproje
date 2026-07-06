import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminRegisterSchema } from "@/lib/validation";
import { signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientIp } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers) ?? "unknown";
  const { allowed, retryAfterSeconds } = rateLimit(`register:${ip}`, 5, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı, birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = adminRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçerli bir e-posta ve en az 6 karakterli bir şifre girin." },
      { status: 400 }
    );
  }

  const { email, password } = parsed.data;
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta ile zaten bir hesap var." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const adminUser = await prisma.adminUser.create({
    data: { email, passwordHash },
  });

  const token = await signAdminSession(adminUser.email);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}
