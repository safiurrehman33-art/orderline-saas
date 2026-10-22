import Link from "next/link";
import {
  ArrowRight,
  Eye,
  FileText,
  Navigation,
  PlusCircle,
  Search,
} from "lucide-react";
import { listCmsPagesForAdmin, listCmsNavForAdmin } from "@/lib/cms/data";
import {
  SaPageHeader,
  SaPrimaryLink,
  SaSecondaryLink,
} from "@/components/super-admin/sa-page-header";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "Overview · Super Admin" };

export default async function SuperAdminHomePage() {
  const [pages, nav] = await Promise.all([
    listCmsPagesForAdmin(),
    listCmsNavForAdmin(),
  ]);

  const published = pages.filter((p) => p.status === "PUBLISHED").length;
  const drafts = pages.length - published;
  const withSeo = pages.filter(
    (p) => p.metaTitle || p.metaDescription,
  ).length;
  const recent = [...pages]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Total pages",
      value: pages.length,
      hint: "All CMS pages",
      icon: FileText,
      tone: "bg-[#e8f7f0] text-[#0d9f6e]",
    },
    {
      label: "Published",
      value: published,
      hint: `${drafts} draft${drafts === 1 ? "" : "s"}`,
      icon: Eye,
      tone: "bg-[#e8f0ff] text-[#3563e9]",
    },
    {
      label: "SEO ready",
      value: withSeo,
      hint: "Meta fields set",
      icon: Search,
      tone: "bg-[#fff4e5] text-[#c27803]",
    },
    {
      label: "Navbar links",
      value: nav.length,
      hint: `${nav.filter((n) => n.visible).length} visible`,
      icon: Navigation,
      tone: "bg-[#f3e8ff] text-[#7c3aed]",
    },
  ];

  return (
    <div className="space-y-8">
      <SaPageHeader
        eyebrow="Dashboard"
        title="Overview"
        description="Control the public marketing site — pages, SEO, and navbar — from one high-level console."
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
        {stats.map((stat) => (
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

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-[#d7e5dc] bg-white shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <div className="flex items-center justify-between border-b border-[#e7eee9] px-5 py-4">
            <div>
              <h3 className="text-sm font-semibold text-[#10241a]">
                Recently updated
              </h3>
              <p className="text-xs text-[#5f7a6c]">Latest CMS page activity</p>
            </div>
            <Link
              href="/super-admin/pages"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0d9f6e] hover:underline"
            >
              All pages
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-[#e7eee9]">
            {recent.map((page) => (
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
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-sm text-[#5f7a6c]">
                No pages yet. Create your first page to get started.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl border border-[#d7e5dc] bg-white p-5 shadow-[0_18px_40px_-34px_rgba(16,36,26,0.45)]">
          <h3 className="text-sm font-semibold text-[#10241a]">Quick actions</h3>
          <p className="mt-1 text-xs text-[#5f7a6c]">
            Jump into the most common Super Admin workflows.
          </p>
          <div className="mt-5 space-y-2">
            {[
              {
                href: "/super-admin/pages/new",
                title: "Create a page",
                text: "New content + SEO fields",
              },
              {
                href: "/super-admin/pages",
                title: "Manage pages",
                text: "Edit, publish, or delete",
              },
              {
                href: "/super-admin/navbar",
                title: "Edit navbar",
                text: "Reorder public header links",
              },
              {
                href: "/about-us",
                title: "Preview About page",
                text: "Open the live marketing About",
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
  );
}
