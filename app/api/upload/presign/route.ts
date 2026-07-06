import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-session";
import { isS3Configured, presignUploadUrl } from "@/lib/storage";
import { MAX_PDF_SIZE_BYTES, MAX_PDF_SIZE_LABEL } from "@/lib/upload-limits";

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Yerel disk modunda presign yok; istemci klasik /api/upload yoluna düşer.
  if (!isS3Configured()) {
    return NextResponse.json({ direct: false });
  }

  const body = await request.json().catch(() => null);
  const size = Number(body?.size);
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Invalid size" }, { status: 400 });
  }
  if (size > MAX_PDF_SIZE_BYTES) {
    return NextResponse.json({ error: `PDF ${MAX_PDF_SIZE_LABEL}'tan küçük olmalı` }, { status: 400 });
  }

  let slug: string;
  const slugInput = body?.slug;
  if (typeof slugInput === "string" && slugInput.trim().length > 0) {
    slug = slugInput.trim();
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Slug yalnızca küçük harf, rakam ve tire içerebilir" }, { status: 400 });
    }
    const existing = await prisma.document.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Bu slug zaten kullanılıyor, farklı bir slug deneyin" }, { status: 400 });
    }
  } else {
    slug = nanoid(10);
  }

  const storageKey = `documents/${slug}.pdf`;
  const uploadUrl = await presignUploadUrl(storageKey, "application/pdf");
  return NextResponse.json({ direct: true, uploadUrl, slug });
}
