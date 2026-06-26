import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const admin = await prisma.adminUser.findFirst({
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
