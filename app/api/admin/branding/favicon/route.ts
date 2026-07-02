import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { saveDocumentFile } from "@/lib/storage";

const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/x-icon", "ico"],
  ["image/vnd.microsoft.icon", "ico"],
  ["image/svg+xml", "svg"],
]);

const MAX_SIZE_BYTES = 1 * 1024 * 1024; // 1MB

export async function POST(request: NextRequest) {
  const email = await requireAdmin();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "PNG, ICO veya SVG bir görsel seçin" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Favicon 1MB'tan küçük olmalı" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  const key = `branding/${admin.id}-favicon.${ALLOWED_TYPES.get(file.type)}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await saveDocumentFile(key, buffer, file.type);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { faviconStorageKey: key, faviconContentType: file.type },
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
    data: { faviconStorageKey: null, faviconContentType: null },
  });

  return NextResponse.json({ ok: true });
}
