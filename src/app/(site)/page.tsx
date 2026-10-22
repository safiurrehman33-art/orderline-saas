import type { Metadata } from "next";
import { connection } from "next/server";
import { ProHome } from "@/components/marketing/pro-home";
import { getHomePage } from "@/lib/cms/data";
import { DEFAULT_HOME_BLOCKS } from "@/lib/cms/types";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { page, blocks } = await getHomePage();
  return {
    title: page?.metaTitle || page?.title || "OrderLine",
    description:
      page?.metaDescription ||
      blocks.hero.subheadline ||
      DEFAULT_HOME_BLOCKS.hero.subheadline,
    keywords: page?.metaKeywords?.split(",").map((k) => k.trim()),
    robots: page?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page?.metaTitle || page?.title || "OrderLine",
      description: page?.metaDescription || blocks.hero.subheadline,
      images: page?.ogImage ? [page.ogImage] : [blocks.hero.imageUrl],
    },
    alternates: {
      canonical: page?.canonicalPath || "/",
    },
  };
}

export default async function MarketingHomePage() {
  await connection();
  const { blocks } = await getHomePage();
  return <ProHome blocks={blocks} />;
}
