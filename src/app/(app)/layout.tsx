import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getUserMemberships, requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await requireTenant();
  const [memberships, organization] = await Promise.all([
    getUserMemberships(tenant.userId),
    db.organization.findUnique({
      where: { id: tenant.organizationId },
      select: { logoUrl: true },
    }),
  ]);

  return (
    <div className="flex min-h-full flex-1">
      <div className="sticky top-0 hidden h-screen lg:block">
        <Sidebar
          organizationName={tenant.organizationName}
          logoUrl={organization?.logoUrl}
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          memberships={memberships.map((m) => ({
            organizationId: m.organizationId,
            name: m.organization.name,
            role: m.role,
          }))}
        />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-6xl animate-fade-up">
            {children}
          </div>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
