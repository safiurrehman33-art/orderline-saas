import { db } from "@/lib/db";

export async function getSuperAdminPlatformStats() {
  const [
    companies,
    users,
    pages,
    publishedPages,
    navItems,
    memberships,
    recentCompanies,
  ] = await Promise.all([
    db.organization.count(),
    db.user.count(),
    db.cmsPage.count(),
    db.cmsPage.count({ where: { status: "PUBLISHED" } }),
    db.cmsNavItem.count(),
    db.membership.count(),
    db.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        _count: { select: { memberships: true } },
      },
    }),
  ]);

  const withSeo = await db.cmsPage.count({
    where: {
      OR: [
        { metaTitle: { not: null } },
        { metaDescription: { not: null } },
      ],
    },
  });

  return {
    companies,
    users,
    pages,
    publishedPages,
    drafts: pages - publishedPages,
    navItems,
    memberships,
    withSeo,
    recentCompanies,
  };
}
