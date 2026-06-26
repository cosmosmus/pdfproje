import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import LogoUploader from "./LogoUploader";
import ContactForm from "./ContactForm";
import Breadcrumbs from "../_components/Breadcrumbs";

export default async function AdminProfilePage() {
  const email = await requireAdmin();
  if (!email) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  return (
    <div className="max-w-5xl">
      <Breadcrumbs items={[{ label: "Genel Bakış", href: "/admin" }, { label: "Profil" }]} />
      <h1 className="font-display font-extrabold text-3xl mb-8">Profil & Marka</h1>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Sol kolon: Logo + Hesap */}
        <div className="space-y-6">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40 mb-3">Logo</p>
            <LogoUploader hasLogo={Boolean(admin?.logoStorageKey)} />
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40 mb-3">Hesap</p>
            <ProfileForm currentEmail={email} />
          </div>
        </div>

        {/* Sağ kolon: İletişim Bilgileri */}
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/40 mb-3">
            İletişim Bilgileri
          </p>
          <p className="text-xs text-ink/40 mb-4">
            404 sayfasında ve döküman görüntüleme ekranında görünür.
          </p>
          <ContactForm
            initial={{
              companyName: admin?.companyName ?? "",
              contactEmail: admin?.contactEmail ?? "",
              contactPhone: admin?.contactPhone ?? "",
              contactWhatsapp: admin?.contactWhatsapp ?? "",
              contactInstagram: admin?.contactInstagram ?? "",
              contactLinkedin: admin?.contactLinkedin ?? "",
              websiteUrl: admin?.websiteUrl ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
