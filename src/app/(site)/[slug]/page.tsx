import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CmsArticle } from "@/components/marketing/cms-article";
import { getPublishedPageBySlug } from "@/lib/cms/data";
import { cmsPageMetadata } from "@/lib/cms/seo-metadata";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const RESERVED = new Set([
  "login",
  "register",
  "dashboard",
  "api",
  "super-admin",
  "pos",
  "kitchen",
  "forgot-password",
  "reset-password",
  "orders",
  "products",
  "categories",
  "deals",
  "tables",
  "customers",
  "reports",
  "pricing",
  "activity",
  "settings",
  "whatsapp",
  "onboarding",
  "about-us",
  "sitemap.xml",
  "robots.txt",
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug) || slug === "home") return {};
  const page = await getPublishedPageBySlug(slug);
  if (!page) return { title: "Not found", robots: { index: false, follow: false } };
  return cmsPageMetadata(page);
}

export default async function CmsSlugPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  if (RESERVED.has(slug) || slug === "home") notFound();

  const page = await getPublishedPageBySlug(slug);
  if (!page || page.template === "HOME") notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
    url: absoluteUrl(page.canonicalPath || `/${page.slug}`),
    isPartOf: {
      "@type": "WebSite",
      name: "OrderLine",
      url: absoluteUrl("/"),
    },
  };

  return (
    <div className="min-h-[70vh] bg-[#f5f9f6]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CmsArticle
        title={page.title}
        excerpt={page.excerpt}
        html={page.contentHtml || "<p></p>"}
      />
    </div>
  );
}
