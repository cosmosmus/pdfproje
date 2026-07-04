import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

// Viewer 7 sn'de bir track atıyor; 60 sn içinde sinyal gelmeyen ziyaret "canlı" sayılmaz.
const LIVE_WINDOW_MS = 60_000;

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cutoff = new Date(Date.now() - LIVE_WINDOW_MS);
  const visits = await prisma.visit.findMany({
    where: { lastEventAt: { gte: cutoff } },
    orderBy: { lastEventAt: "desc" },
    select: {
      id: true,
      country: true,
      startedAt: true,
      viewerSession: { select: { email: true } },
      document: { select: { id: true, title: true } },
      pageViewEvents: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { pageNumber: true },
      },
    },
  });

  return NextResponse.json({
    viewers: visits.map((v) => ({
      visitId: v.id,
      email: v.viewerSession.email,
      documentId: v.document.id,
      documentTitle: v.document.title,
      currentPage: v.pageViewEvents[0]?.pageNumber ?? null,
      country: v.country,
      startedAt: v.startedAt.toISOString(),
    })),
  });
}
