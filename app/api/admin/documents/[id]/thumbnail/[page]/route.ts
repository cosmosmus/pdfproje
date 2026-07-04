import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { readThumbnail } from "@/lib/thumbnails";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; page: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, page } = await params;
  const pageNumber = Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { id },
    select: { version: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versionParam = request.nextUrl.searchParams.get("v");
  const version = versionParam === null ? document.version : Number(versionParam);
  if (!Number.isInteger(version) || version < 1 || version > document.version) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  try {
    const buffer = await readThumbnail(id, version, pageNumber);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
