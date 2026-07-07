import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackRequestSchema } from "@/lib/validation";
import { gateCookieName, verifyGateToken } from "@/lib/auth";
import { getClientIp, lookupGeoLive } from "@/lib/geo";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = trackRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { slug, visitId, referrer, entries } = parsed.data;
  const document = await prisma.document.findUnique({ where: { slug } });
  if (!document || !document.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookieValue = request.cookies.get(gateCookieName(document.id))?.value;
  const gate = cookieValue ? await verifyGateToken(cookieValue, document.id) : null;
  if (!gate) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Normal viewer sends one batch every few seconds at most; this only stops abuse.
  const { allowed } = rateLimit(`track:${gate.sid}`, 300, 10 * 60 * 1000);
  if (!allowed) {
    return new NextResponse(null, { status: 429 });
  }

  const validEntries = entries.filter(
    (entry) => entry.page >= 1 && entry.page <= document.pageCount
  );
  if (validEntries.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const ip = getClientIp(request.headers);
  const userAgent = request.headers.get("user-agent");

  // A visit id may only be reused by the session that created it.
  const existingVisit = await prisma.visit.findUnique({
    where: { id: visitId },
    select: { viewerSessionId: true, country: true, city: true, latitude: true, longitude: true },
  });
  if (existingVisit && existingVisit.viewerSessionId !== gate.sid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Geolocate once per visit (a viewer sends a new batch every ~7s while the
  // tab is open) — reuse what was already stored instead of re-querying the
  // live geo service on every flush.
  const { country, city, latitude, longitude } = existingVisit
    ? existingVisit
    : await lookupGeoLive(ip);

  await prisma.visit.upsert({
    where: { id: visitId },
    create: {
      id: visitId,
      documentId: document.id,
      viewerSessionId: gate.sid,
      documentVersion: document.version,
      ipAddress: ip,
      userAgent,
      referrer,
      country,
      city,
      latitude,
      longitude,
    },
    update: { lastEventAt: new Date() },
  });

  await prisma.$transaction([
    ...validEntries.map((entry) =>
      prisma.pageViewEvent.create({
        data: {
          viewerSessionId: gate.sid,
          documentId: document.id,
          visitId,
          pageNumber: entry.page,
          durationMs: entry.durationMs,
          country,
        },
      })
    ),
    prisma.viewerSession.update({
      where: { id: gate.sid },
      data: { lastSeenAt: new Date() },
    }),
  ]);

  return new NextResponse(null, { status: 204 });
}
