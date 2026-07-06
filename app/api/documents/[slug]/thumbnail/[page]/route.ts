import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readOrGenerateThumbnail } from "@/lib/thumbnails";
import { gateCookieName, verifyGateToken } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin-session";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; page: string }> }
) {
  const { slug, page } = await params;
  const pageNumber = Number(page);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const document = await prisma.document.findUnique({
    where: { slug },
    select: { id: true, version: true, storageKey: true, pageCount: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const versionParam = request.nextUrl.searchParams.get("v");
  const version = versionParam === null ? document.version : Number(versionParam);
  if (!Number.isInteger(version) || version < 1 || version > document.version) {
    return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  }

  // Page renders are readable content: only gated viewers of this document
  // or the logged-in admin may fetch them — otherwise the email gate could
  // be bypassed entirely by requesting thumbnails.
  const cookieValue = request.cookies.get(gateCookieName(document.id))?.value;
  const gate = cookieValue ? await verifyGateToken(cookieValue, document.id) : null;
  // Gated viewers only ever see the current PDF; past versions are admin-only.
  const gateSuffices = gate !== null && version === document.version;
  if (!gateSuffices) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const buffer = await readOrGenerateThumbnail(document.id, version, pageNumber, {
      storageKey: document.storageKey,
      isCurrentVersion: version === document.version,
      pageCount: document.pageCount,
    });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Thumbnail unavailable", document.id, `v${version}`, pageNumber, err);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
