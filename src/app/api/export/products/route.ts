import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.user.role, "products:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const products = await db.product.findMany({
    where: { organizationId: session.user.organizationId },
    include: { category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const header = [
    "name",
    "sku",
    "category",
    "price",
    "cost",
    "currency",
    "stockQty",
    "trackStock",
    "active",
    "archived",
    "imageUrl",
  ];

  const rows = products.map((p) =>
    [
      p.name,
      p.sku,
      p.category?.name ?? "",
      (p.priceCents / 100).toFixed(2),
      p.costCents != null ? (p.costCents / 100).toFixed(2) : "",
      p.currency,
      p.stockQty,
      p.trackStock ? "yes" : "no",
      p.active ? "yes" : "no",
      p.archivedAt ? "yes" : "no",
      p.imageUrl ?? "",
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const slug = session.user.organizationSlug || "workspace";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="products-${slug}.csv"`,
    },
  });
}
