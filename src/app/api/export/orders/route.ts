import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.user.role, "orders:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await db.order.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      customer: { select: { name: true, email: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = [
    "orderNumber",
    "status",
    "customer",
    "customerEmail",
    "items",
    "total",
    "currency",
    "placedAt",
    "createdAt",
  ];

  const rows = orders.map((o) =>
    [
      o.orderNumber,
      o.status,
      o.customer?.name ?? "",
      o.customer?.email ?? "",
      o._count.items,
      (o.totalCents / 100).toFixed(2),
      o.currency,
      o.placedAt?.toISOString() ?? "",
      o.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const slug = session.user.organizationSlug || "workspace";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${slug}.csv"`,
    },
  });
}
