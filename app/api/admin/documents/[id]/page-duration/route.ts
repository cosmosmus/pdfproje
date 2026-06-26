import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const RANGES = {
  "1d": 1,
  "7d": 7,
  "15d": 15,
  "30d": 30,
  all: null,
} as const;

type Range = keyof typeof RANGES;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const rangeParam = (request.nextUrl.searchParams.get("range") ?? "all") as Range;
  const days = RANGES[rangeParam] ?? null;

  const cutoff = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;

  const events = await prisma.pageViewEvent.findMany({
    where: {
      documentId: id,
      ...(cutoff ? { createdAt: { gte: cutoff } } : {}),
    },
    select: { pageNumber: true, durationMs: true },
  });

  const pageTotals = new Map<number, number>();
  for (const e of events) {
    pageTotals.set(e.pageNumber, (pageTotals.get(e.pageNumber) ?? 0) + e.durationMs);
  }

  const data = Array.from({ length: document.pageCount }, (_, i) => {
    const page = i + 1;
    return { page, seconds: Math.round((pageTotals.get(page) ?? 0) / 1000) };
  });

  return NextResponse.json({ data });
}
