import type { Metadata } from "next";
import { connection } from "next/server";
import { AboutPremium } from "@/components/marketing/about-premium";
import { getPublishedPageBySlug } from "@/lib/cms/data";
import { cmsPageMetadata } from "@/lib/cms/seo-metadata";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const FALLBACK = {
  title: "About Us",
  excerpt:
    "OrderLine is the multi-tenant restaurant platform that connects POS, kitchen, tables, customers, reports, and WhatsApp AI for modern restaurant owners.",
  metaTitle: "About OrderLine | Restaurant POS, Kitchen & WhatsApp AI Platform",
  metaDescription:
    "Learn about OrderLine — the multi-tenant restaurant operating system for owners. Discover our mission, values, and how POS, kitchen, and WhatsApp AI work in one platform.",
  metaKeywords:
    "about orderline, restaurant management software, restaurant pos platform, whatsapp ai ordering, multi-tenant restaurant saas, kitchen display system",
  ogImage: "/menu/menu-chicken.jpg",
  contentHtml: "",
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageBySlug("about-us");
  return cmsPageMetadata({
    title: page?.title || FALLBACK.title,
    slug: "about-us",
    excerpt: page?.excerpt || FALLBACK.excerpt,
    metaTitle: page?.metaTitle || FALLBACK.metaTitle,
    metaDescription: page?.metaDescription || FALLBACK.metaDescription,
    metaKeywords: page?.metaKeywords || FALLBACK.metaKeywords,
    ogImage: page?.ogImage || FALLBACK.ogImage,
    canonicalPath: page?.canonicalPath || "/about-us",
    noIndex: page?.noIndex,
  });
}

export default async function AboutUsPage() {
  await connection();
  const page = await getPublishedPageBySlug("about-us");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: page?.metaTitle || FALLBACK.metaTitle,
    description: page?.metaDescription || FALLBACK.metaDescription,
    url: absoluteUrl("/about-us"),
    isPartOf: {
      "@type": "WebSite",
      name: "OrderLine",
      url: absoluteUrl("/"),
    },
    about: {
      "@type": "Organization",
      name: "OrderLine",
      description:
        "Multi-tenant restaurant operations platform with POS, kitchen display, tables, customers, reports, smart pricing, and WhatsApp AI.",
      url: absoluteUrl("/"),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutPremium
        title={page?.title || FALLBACK.title}
        excerpt={page?.excerpt || FALLBACK.excerpt}
        contentHtml={page?.contentHtml || FALLBACK.contentHtml}
      />
    </>
  );
}
