import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import ProfileForm from "./ProfileForm";
import LogoUploader from "./LogoUploader";
import ContactForm from "./ContactForm";
import GroupLabelsForm from "./GroupLabelsForm";
import FaviconUploader from "./FaviconUploader";
import Breadcrumbs from "../_components/Breadcrumbs";

export default async function AdminProfilePage() {
  const email = await requireAdmin();
  if (!email) redirect("/admin/login");

  const admin = await prisma.adminUser.findUnique({ where: { email } });

  return (
    <div className="max-w-5xl">
      <Breadcrumbs items={[{ label: "Panel", href: "/admin" }, { label: "Profil" }]} />
      <div className="bg-surface rounded-[28px] px-6 py-5 md:px-8 mb-4 md:mb-6">
        <h1 className="font-display font-extrabold text-2xl tracking-tight">Profil & Marka</h1>
        <p className="text-sm text-ink/45 mt-0.5">Hesap, logo ve iletişim bilgilerin.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 items-start">
        {/* Sol kolon: Logo + Hesap */}
        <div className="space-y-4 md:space-y-6">
          <LogoUploader hasLogo={Boolean(admin?.logoStorageKey)} />
          <FaviconUploader hasFavicon={Boolean(admin?.faviconStorageKey)} />
          <ProfileForm currentEmail={email} />
        </div>

        {/* Sağ kolon: İletişim Bilgileri + Grup İsimleri */}
        <div className="space-y-4 md:space-y-6">
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
          <GroupLabelsForm
            initial={{
              labelAppMember: admin?.labelAppMember ?? "",
              labelUnknownCustomer: admin?.labelUnknownCustomer ?? "",
              labelCurrentCustomer: admin?.labelCurrentCustomer ?? "",
              labelPotentialCustomer: admin?.labelPotentialCustomer ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
