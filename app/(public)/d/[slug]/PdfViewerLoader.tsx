"use client";

import dynamic from "next/dynamic";

const PdfViewer = dynamic(() => import("./PdfViewer"), { ssr: false });

type ContactInfo = {
  companyName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactWhatsapp: string | null;
  contactInstagram: string | null;
  contactLinkedin: string | null;
  websiteUrl: string | null;
  logoStorageKey: string | null;
} | null;

export default function PdfViewerLoader(props: {
  slug: string;
  title: string;
  pageCount: number;
  fileUrl: string;
  lastUpdated?: string;
  contact?: ContactInfo;
  locale?: "tr" | "en";
}) {
  return <PdfViewer {...props} />;
}
