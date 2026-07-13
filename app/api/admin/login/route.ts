import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { adminLoginSchema } from "@/lib/validation";
import { signAdminSession, ADMIN_SESSION_COOKIE, ADMIN_SESSION_TTL_SECONDS } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientIp, lookupGeoLive } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Records a successful login (when/where/device) for the profile page's
 * "Son Girişler" table. Must never block or fail the login itself.
 * Geo answers are reused per IP for 30 days, same policy as /api/track.
 */
async function recordLoginEvent(email: string, ip: string | null, userAgent: string | null) {
  try {
    const REUSE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
    const geo =
      (ip
        ? await prisma.adminLoginEvent.findFirst({
            where: {
              ipAddress: ip,
              country: { not: null },
              createdAt: { gte: new Date(Date.now() - REUSE_WINDOW_MS) },
            },
            orderBy: { createdAt: "desc" },
            select: { country: true, city: true },
          })
        : null) ?? (await lookupGeoLive(ip));

    await prisma.adminLoginEvent.create({
      data: { email, ipAddress: ip, userAgent, country: geo.country, city: geo.city },
    });
  } catch {
    // Log tutulamadıysa giriş yine de başarılı sayılır.
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers) ?? "unknown";
  const { allowed, retryAfterSeconds } = rateLimit(`login:${ip}`, 8, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı, birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const adminUser = await prisma.adminUser.findUnique({ where: { email } });
  if (!adminUser) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, adminUser.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  await recordLoginEvent(
    adminUser.email,
    ip === "unknown" ? null : ip,
    request.headers.get("user-agent")
  );

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
