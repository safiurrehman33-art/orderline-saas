import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const pages = await db.cmsPage.findMany({
    where: { status: "PUBLISHED", noIndex: false },
    select: {
      slug: true,
      updatedAt: true,
      publishedAt: true,
      canonicalPath: true,
      template: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const page of pages) {
    if (page.slug === "home") continue;
    const path =
      page.canonicalPath && !page.canonicalPath.startsWith("http")
        ? page.canonicalPath
        : `/${page.slug}`;
    entries.push({
      url: page.canonicalPath?.startsWith("http")
        ? page.canonicalPath
        : absoluteUrl(path),
      lastModified: page.updatedAt || page.publishedAt || now,
      changeFrequency: "monthly",
      priority: page.slug === "about-us" ? 0.9 : 0.7,
    });
  }

  return entries;
}
