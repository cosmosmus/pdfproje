import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/storage";
import { thumbnailKey } from "@/lib/thumbnails";
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
    select: { id: true },
  });
  if (!document) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Page renders are readable content: only gated viewers of this document
  // or the logged-in admin may fetch them — otherwise the email gate could
  // be bypassed entirely by requesting thumbnails.
  const cookieValue = request.cookies.get(gateCookieName(document.id))?.value;
  const gate = cookieValue ? await verifyGateToken(cookieValue, document.id) : null;
  if (!gate) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const buffer = await readDocumentFile(thumbnailKey(document.id, pageNumber));
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
