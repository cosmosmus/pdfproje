import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { readDocumentFile } from "@/lib/storage";

export async function GET() {
  // Site geneli marka logosu: ilk kurulan (sahip) hesabın logosu esastır.
  // updatedAt'e göre seçmek, başka bir hesap profilinde herhangi bir alanı
  // güncellediğinde logonun el değiştirmesine yol açıyordu.
  const admin = await prisma.adminUser.findFirst({
    where: { logoStorageKey: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { logoStorageKey: true, logoContentType: true },
  });

  if (!admin?.logoStorageKey || !admin.logoContentType) {
    return NextResponse.json({ error: "Logo yok" }, { status: 404 });
  }

  try {
    const buffer = await readDocumentFile(admin.logoStorageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": admin.logoContentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
        "X-Content-Type-Options": "nosniff",
        // SVG doğrudan adres çubuğunda açılırsa bile script çalışamasın.
        "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      },
    });
  } catch {
    return NextResponse.json({ error: "Logo bulunamadı" }, { status: 404 });
  }
}
