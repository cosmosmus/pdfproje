import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Site geneli iletişim bilgileri de sahip hesaptan (ilk kurulan) gelir.
  const admin = await prisma.adminUser.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      companyName: true,
      contactEmail: true,
      contactPhone: true,
      contactWhatsapp: true,
      contactInstagram: true,
      contactLinkedin: true,
      websiteUrl: true,
      logoStorageKey: true,
    },
  });

  return NextResponse.json(admin ?? {});
}
