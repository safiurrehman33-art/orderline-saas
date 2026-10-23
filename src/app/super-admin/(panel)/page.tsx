import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Eye,
  FileText,
  Navigation,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";
import { listCmsPagesForAdmin, listCmsNavForAdmin } from "@/lib/cms/data";
import { getSuperAdminPlatformStats } from "@/lib/cms/platform-stats";
import {
  SaPageHeader,
  SaPrimaryLink,
  SaSecondaryLink,
} from "@/components/super-admin/sa-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Overview · Super Admin" };

export default async function SuperAdminHomePage() {
  const [pages, nav, stats] = await Promise.all([
    listCmsPagesForAdmin(),
    listCmsNavForAdmin(),
    getSuperAdminPlatformStats(),
  ]);

  const recentPages = [...pages]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const kpiCards = [
    {
      label: "Companies registered",
      value: stats.companies,
      hint: `${stats.memberships} total memberships`,
      icon: Building2,
      tone: "bg-[#e8f7f0] text-[#0d9f6e]",
    },
    {
      label: "Users",
      value: stats.users,
      hint: "Platform accounts",
      icon: Users,
      tone: "bg-[#e8f0ff] text-[#3563e9]",
    },
    {
      label: "CMS pages",
      value: stats.pages,
      hint: `${stats.publishedPages} published · ${stats.drafts} draft`,
      icon: FileText,
      tone: "bg-[#fff4e5] text-[#c27803]",
    },
    {
      label: "SEO ready",
      value: stats.withSeo,
      hint: `${nav.filter((n) => n.visible).length}/${nav.length} nav visible`,
      icon: Search,
      tone: "bg-[#f3e8ff] text-[#7c3aed]",
    },
  ];

  return (
    <div className="space-y-8">
      <SaPageHeader
        eyebrow="Platform dashboard"
        title="Overview"
        description="Track registered companies, CMS content, SEO coverage, and navbar from one console."
        actions={
          <>
            <SaPrimaryLink href="/super-admin/pages/new">
              <PlusCircle className="h-4 w-4" />
              Create page
            </SaPrimaryLink>
            <SaSecondaryLink href="/">View live site</SaSecondaryLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5f7a6c]">
                  {stat.label}
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-tight text-[#10241a]">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs text-[#7a9184]">{stat.hint}</p>
              </div>
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.tone}`}
              >
                <stat.icon className="h-5 w-5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#0d9f6e]" />
            <h3 className="text-sm font-semibold text-[#10241a]">Published</h3>
          </div>
          <p className="mt-3 text-3xl font-semibold text-[#10241a]">
            {stats.publishedPages}
          </p>
          <p className="mt-1 text-xs text-[#5f7a6c]">Live marketing pages</p>
        </div>
        <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#c27803]" />
            <h3 className="text-sm font-semibold text-[#10241a]">Drafts</h3>
          </div>
          <p className="mt-3 text-3xl font-semibold text-[#10241a]">
            {stats.drafts}
          </p>
          <p className="mt-1 text-xs text-[#5f7a6c]">Not yet on the frontend</p>
        </div>
        <div className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-[#7c3aed]" />
            <h3 className="text-sm font-semibold text-[#10241a]">Navbar</h3>
          </div>
          <p className="mt-3 text-3xl font-semibold text-[#10241a]">
            {stats.navItems}
          </p>
          <p className="mt-1 text-xs text-[#5f7a6c]">Header links configured</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-[#d7e5dc] bg-white shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <div className="flex items-center justify-between border-b border-[#e7eee9] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[#10241a]">
                Registered companies
              </h3>
              <p className="text-xs text-[#5f7a6c]">
                Newest restaurant workspaces on the platform
              </p>
            </div>
            <span className="rounded-full bg-[#e8f7f0] px-2.5 py-1 text-xs font-semibold text-[#0d9f6e]">
              {stats.companies} total
            </span>
          </div>
          <div className="divide-y divide-[#e7eee9]">
            {stats.recentCompanies.map((org) => (
              <div
                key={org.id}
                className="flex items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#10241a]">
                    {org.name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-[#7a9184]">
                    /{org.slug}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-[#3d5649]">
                    {org._count.memberships} member
                    {org._count.memberships === 1 ? "" : "s"}
                  </p>
                  <p className="text-[11px] text-[#7a9184]">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {stats.recentCompanies.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#5f7a6c]">
                No companies registered yet.
              </p>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[#d7e5dc] bg-white shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
            <div className="flex items-center justify-between border-b border-[#e7eee9] px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-[#10241a]">
                  Recent pages
                </h3>
                <p className="text-xs text-[#5f7a6c]">Latest CMS updates</p>
              </div>
              <Link
                href="/super-admin/pages"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#0d9f6e] hover:underline"
              >
                All
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-[#e7eee9]">
              {recentPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/super-admin/pages/${page.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 transition hover:bg-[#f7fbf8]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#10241a]">
                      {page.title}
                    </p>
                    <p className="truncate font-mono text-[11px] text-[#7a9184]">
                      /{page.slug === "home" ? "" : page.slug}
                    </p>
                  </div>
                  <Badge
                    tone={page.status === "PUBLISHED" ? "success" : "neutral"}
                  >
                    {page.status}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
            <h3 className="text-sm font-semibold text-[#10241a]">
              Quick actions
            </h3>
            <div className="mt-4 space-y-2">
              {[
                {
                  href: "/super-admin/pages/new",
                  title: "Create page + HTML",
                  text: "Visual or raw HTML editor",
                },
                {
                  href: "/super-admin/pages",
                  title: "Manage pages & SEO",
                  text: "Canonical, meta, publish",
                },
                {
                  href: "/super-admin/navbar",
                  title: "Edit navbar",
                  text: "Public header links",
                },
                {
                  href: "/sitemap.xml",
                  title: "View sitemap",
                  text: "SEO sitemap.xml",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center justify-between rounded-xl border border-[#e7eee9] bg-[#f7fbf8] px-4 py-3 transition hover:border-[#0d9f6e]/30 hover:bg-white"
                >
                  <div>
                    <p className="text-sm font-medium text-[#10241a]">
                      {item.title}
                    </p>
                    <p className="text-xs text-[#5f7a6c]">{item.text}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#0d9f6e]" />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
