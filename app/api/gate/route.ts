import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { gateRequestSchema } from "@/lib/validation";
import { gateCookieName, signGateToken, GATE_TOKEN_MAX_AGE_SECONDS } from "@/lib/auth";
import { getClientIp } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers) ?? "unknown";
  const { allowed, retryAfterSeconds } = rateLimit(`gate:${ip}`, 20, 10 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Çok fazla deneme yapıldı, birkaç dakika sonra tekrar deneyin." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = gateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { slug, email } = parsed.data;
  const document = await prisma.document.findUnique({ where: { slug } });
  if (!document || !document.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expiresAt = new Date(Date.now() + GATE_TOKEN_MAX_AGE_SECONDS * 1000);

  const viewerSession = await prisma.viewerSession.upsert({
    where: { documentId_email: { documentId: document.id, email } },
    update: { lastSeenAt: new Date(), expiresAt },
    create: { documentId: document.id, email, expiresAt },
  });

  // İlk kez görülen e-posta, Kişiler listesine varsayılan grupla
  // (tanınmayan müşteri) düşer; mevcut kayıtların grubuna dokunulmaz.
  await prisma.contact.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  const token = await signGateToken({
    documentId: document.id,
    email,
    sid: viewerSession.id,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(gateCookieName(document.id), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GATE_TOKEN_MAX_AGE_SECONDS,
  });
  return response;
}
