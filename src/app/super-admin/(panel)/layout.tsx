import { Sora } from "next/font/google";
import { requireSuperAdmin } from "@/lib/cms/super-admin";
import { SaSidebar } from "@/components/super-admin/sa-sidebar";
import { SaTopbar } from "@/components/super-admin/sa-topbar";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export default async function SuperAdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSuperAdmin();

  return (
    <div className={`${sora.variable} flex min-h-screen bg-[#f3f7f4] text-[#10241a]`}>
      <SaSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <SaTopbar
          email={session.user.email}
          title="CMS Console"
          subtitle="Pages · SEO · Navbar"
        />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
