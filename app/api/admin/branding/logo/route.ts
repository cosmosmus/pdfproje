import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { saveDocumentFile, readDocumentFile } from "@/lib/storage";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

export async function GET() {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin?.logoStorageKey || !admin.logoContentType) {
    return NextResponse.json({ error: "Logo yok" }, { status: 404 });
  }

  try {
    const buffer = await readDocumentFile(admin.logoStorageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": admin.logoContentType,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo bulunamadı" }, { status: 404 });
  }
}

export async function POST(request: NextRequest) {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "PNG, JPEG, WEBP veya SVG bir görsel seçin" }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Görsel 2MB'tan küçük olmalı" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const ext = file.type.split("/")[1].replace("svg+xml", "svg");
  const key = `branding/${admin.id}-logo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveDocumentFile(key, buffer, file.type);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { logoStorageKey: key, logoContentType: file.type },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.adminUser.update({
    where: { email },
    data: { logoStorageKey: null, logoContentType: null },
  });

  return NextResponse.json({ ok: true });
}
