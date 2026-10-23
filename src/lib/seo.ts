export function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "";
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function absoluteUrl(path = "/") {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalFromPage(input?: {
  canonicalPath?: string | null;
  slug?: string | null;
}) {
  if (input?.canonicalPath) {
    return input.canonicalPath.startsWith("http")
      ? input.canonicalPath
      : absoluteUrl(input.canonicalPath);
  }
  if (!input?.slug || input.slug === "home") return absoluteUrl("/");
  return absoluteUrl(`/${input.slug}`);
}

export const DEFAULT_SITE_SEO = {
  name: "OrderLine",
  title: "OrderLine — Restaurant POS, Kitchen & WhatsApp AI",
  description:
    "Multi-tenant restaurant operations platform with POS, kitchen display, tables, customers, reports, smart pricing, and WhatsApp AI ordering.",
  keywords: [
    "restaurant pos",
    "kitchen display system",
    "whatsapp ordering",
    "restaurant management software",
    "multi-tenant restaurant saas",
    "orderline",
  ],
};
