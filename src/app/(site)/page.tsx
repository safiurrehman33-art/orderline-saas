import type { Metadata } from "next";
import { connection } from "next/server";
import { ProHome } from "@/components/marketing/pro-home";
import { getHomePage } from "@/lib/cms/data";
import { DEFAULT_HOME_BLOCKS } from "@/lib/cms/types";
import { cmsPageMetadata } from "@/lib/cms/seo-metadata";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { page, blocks } = await getHomePage();
  if (page) {
    return cmsPageMetadata({
      title: page.title,
      slug: page.slug,
      excerpt: page.excerpt || blocks.hero.subheadline,
      metaTitle: page.metaTitle,
      metaDescription: page.metaDescription || blocks.hero.subheadline,
      metaKeywords: page.metaKeywords,
      ogImage: page.ogImage || blocks.hero.imageUrl,
      canonicalPath: page.canonicalPath || "/",
      noIndex: page.noIndex,
    });
  }
  return cmsPageMetadata({
    title: "OrderLine",
    slug: "home",
    excerpt: DEFAULT_HOME_BLOCKS.hero.subheadline,
    metaTitle: "OrderLine — Restaurant POS, Kitchen & WhatsApp AI",
    metaDescription: DEFAULT_HOME_BLOCKS.hero.subheadline,
    ogImage: DEFAULT_HOME_BLOCKS.hero.imageUrl,
    canonicalPath: "/",
  });
}

export default async function MarketingHomePage() {
  await connection();
  const { page, blocks } = await getHomePage();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OrderLine",
    url: absoluteUrl("/"),
    description:
      page?.metaDescription ||
      blocks.hero.subheadline ||
      DEFAULT_HOME_BLOCKS.hero.subheadline,
    potentialAction: {
      "@type": "SearchAction",
      target: absoluteUrl("/about-us"),
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProHome blocks={blocks} />
    </>
  );
}
