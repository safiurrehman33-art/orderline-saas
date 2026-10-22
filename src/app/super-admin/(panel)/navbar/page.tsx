import { NavbarManager } from "@/components/cms/navbar-manager";
import { listCmsNavForAdmin, listCmsPagesForAdmin } from "@/lib/cms/data";
import { SaPageHeader } from "@/components/super-admin/sa-page-header";

export const metadata = { title: "Navbar · Super Admin" };

export default async function SuperAdminNavbarPage() {
  const [nav, pages] = await Promise.all([
    listCmsNavForAdmin(),
    listCmsPagesForAdmin(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SaPageHeader
        eyebrow="Navigation"
        title="Navbar"
        description="Control which links appear on the public site header. List order is top to bottom (first = leftmost)."
      />
      <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)] sm:p-7">
        <NavbarManager
          initialItems={nav.map((n) => ({
            id: n.id,
            label: n.label,
            href: n.href,
            visible: n.visible,
            openInNewTab: n.openInNewTab,
            pageId: n.pageId,
          }))}
          pages={pages.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
          }))}
        />
      </div>
    </div>
  );
}
