import { prisma } from "@/lib/db";

export default async function Home() {
  // Markalaması olan hesabın logosu/adı; hiç yoksa uygulama adına düşer.
  const admin = await prisma.adminUser.findFirst({
    where: { OR: [{ logoStorageKey: { not: null } }, { companyName: { not: null } }] },
    orderBy: { updatedAt: "desc" },
    select: { logoStorageKey: true, companyName: true },
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-shell gap-4">
      {admin?.logoStorageKey ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/api/branding/logo"
          alt={admin.companyName ?? "Logo"}
          className="h-14 w-auto max-w-[220px] object-contain"
        />
      ) : (
        <p className="font-display font-extrabold text-3xl text-ink">
          {admin?.companyName ?? "Vitrin"}
        </p>
      )}
      {admin?.logoStorageKey && admin.companyName && (
        <p className="text-sm font-medium text-ink/50">{admin.companyName}</p>
      )}
    </div>
  );
}
