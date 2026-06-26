import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/storage";
import { gateCookieName, verifyGateToken } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const document = await prisma.document.findUnique({ where: { slug } });
  if (!document || !document.isActive) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookieValue = request.cookies.get(gateCookieName(document.id))?.value;
  const gate = cookieValue ? await verifyGateToken(cookieValue, document.id) : null;
  if (!gate) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const buffer = await readDocumentFile(document.storageKey);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${document.originalFilename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
