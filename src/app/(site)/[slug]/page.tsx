import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { CmsArticle } from "@/components/marketing/cms-article";
import { getPublishedPageBySlug } from "@/lib/cms/data";

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
]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug) || slug === "home") return {};
  const page = await getPublishedPageBySlug(slug);
  if (!page) return { title: "Not found" };
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt || undefined,
    keywords: page.metaKeywords?.split(",").map((k) => k.trim()),
    robots: page.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.excerpt || undefined,
      images: page.ogImage ? [page.ogImage] : undefined,
    },
    alternates: {
      canonical: page.canonicalPath || `/${page.slug}`,
    },
  };
}

export default async function CmsSlugPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  if (RESERVED.has(slug) || slug === "home") notFound();

  const page = await getPublishedPageBySlug(slug);
  if (!page || page.template === "HOME") notFound();

  return (
    <div className="min-h-[70vh] bg-[#f5f9f6]">
      <CmsArticle title={page.title} html={page.contentHtml || "<p></p>"} />
    </div>
  );
}
