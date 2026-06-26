import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { trackRequestSchema } from "@/lib/validation";
import { gateCookieName, verifyGateToken } from "@/lib/auth";
import { getClientIp, lookupCountry } from "@/lib/geo";

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

  const validEntries = entries.filter(
    (entry) => entry.page >= 1 && entry.page <= document.pageCount
  );
  if (validEntries.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const ip = getClientIp(request.headers);
  const country = lookupCountry(ip);
  const userAgent = request.headers.get("user-agent");

  await prisma.visit.upsert({
    where: { id: visitId },
    create: {
      id: visitId,
      documentId: document.id,
      viewerSessionId: gate.sid,
      ipAddress: ip,
      userAgent,
      referrer,
      country,
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
