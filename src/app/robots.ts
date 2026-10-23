import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/dashboard/",
          "/pos",
          "/pos/",
          "/orders",
          "/orders/",
          "/kitchen",
          "/kitchen/",
          "/products",
          "/products/",
          "/categories",
          "/categories/",
          "/deals",
          "/deals/",
          "/tables",
          "/tables/",
          "/customers",
          "/customers/",
          "/reports",
          "/reports/",
          "/pricing",
          "/pricing/",
          "/activity",
          "/activity/",
          "/settings",
          "/settings/",
          "/whatsapp",
          "/whatsapp/",
          "/onboarding",
          "/onboarding/",
          "/super-admin",
          "/super-admin/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
