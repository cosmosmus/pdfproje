import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { isS3Configured, presignUploadUrl } from "@/lib/storage";
import { MAX_PDF_SIZE_BYTES, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Yerel disk modunda presign yok; istemci klasik replace yoluna düşer.
  if (!isS3Configured()) {
    return NextResponse.json({ direct: false });
  }

  const { id } = await params;
  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return NextResponse.json({ error: "Döküman bulunamadı" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }
  if (size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: `PDF ${MAX_PDF_SIZE_LABEL}'tan küçük olmalı` }, { status: 400 });
  }

  const uploadUrl = await presignUploadUrl(document.storageKey, "application/pdf");
  return NextResponse.json({ direct: true, uploadUrl });
}
