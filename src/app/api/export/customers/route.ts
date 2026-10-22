import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.organizationId || !session.user.role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!can(session.user.role, "customers:read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customers = await db.customer.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { name: "asc" },
  });

  const header = [
    "name",
    "email",
    "phone",
    "company",
    "city",
    "state",
    "country",
    "tags",
    "archived",
    "createdAt",
  ];

  const rows = customers.map((c) =>
    [
      c.name,
      c.email ?? "",
      c.phone ?? "",
      c.company ?? "",
      c.city ?? "",
      c.state ?? "",
      c.country ?? "",
      c.tags.join("|"),
      c.archivedAt ? "yes" : "no",
      c.createdAt.toISOString(),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");
  const slug = session.user.organizationSlug || "workspace";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${slug}.csv"`,
    },
  });
}
