import type { Metadata } from "next";
import { absoluteUrl, canonicalFromPage } from "@/lib/seo";

type CmsSeoInput = {
  title: string;
  slug: string;
  excerpt?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  canonicalPath?: string | null;
  noIndex?: boolean;
};

export function cmsPageMetadata(page: CmsSeoInput): Metadata {
  const title = page.metaTitle || page.title;
  const description = page.metaDescription || page.excerpt || undefined;
  const canonical = canonicalFromPage(page);
  const keywords = page.metaKeywords
    ?.split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const image = page.ogImage
    ? page.ogImage.startsWith("http")
      ? page.ogImage
      : absoluteUrl(page.ogImage)
    : undefined;

  return {
    title,
    description,
    keywords,
    robots: page.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: image ? [{ url: image, alt: title }] : undefined,
      siteName: "OrderLine",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical,
    },
  };
}
