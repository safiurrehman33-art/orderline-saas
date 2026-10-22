"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { tableSchema } from "@/lib/validations/table";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import type { TableStatus } from "@/generated/prisma/client";
import { Prisma } from "@/generated/prisma/client";
import { floorGridPosition } from "@/lib/tables/layout";

export async function listTables() {
  const tenant = await requirePermission("tables:read");
  const tables = await db.diningTable.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
    include: {
      orders: {
        where: {
          status: { in: ["DRAFT", "PENDING", "CONFIRMED", "READY"] },
        },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalCents: true,
          guestCount: true,
        },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Stacked / default positions → persist the same grid as Auto arrange
  const uniquePositions = new Set(tables.map((t) => `${t.posX},${t.posY}`));
  const needsInitialLayout =
    tables.length > 0 &&
    (uniquePositions.size === 1 ||
      tables.every((t) => t.posX === 80 && t.posY === 80));

  if (needsInitialLayout) {
    await Promise.all(
      tables.map((table, index) => {
        const { posX, posY } = floorGridPosition(index);
        return db.diningTable.update({
          where: { id: table.id },
          data: { posX, posY, shape: "CLOUD" },
        });
      }),
    );
    return tables.map((table, index) => {
      const { posX, posY } = floorGridPosition(index);
      return { ...table, posX, posY, shape: "CLOUD" as const };
    });
  }

  return tables;
}

export async function createTableAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("tables:write");
  const parsed = tableSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    seats: String(formData.get("seats") ?? "4"),
    section: String(formData.get("section") ?? ""),
    status: String(formData.get("status") ?? "AVAILABLE"),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existingCount = await db.diningTable.count({
    where: { organizationId: tenant.organizationId },
  });
  const col = existingCount % 5;
  const row = Math.floor(existingCount / 5);

  try {
    const table = await db.diningTable.create({
      data: {
        organizationId: tenant.organizationId,
        name: parsed.data.name.trim(),
        code: parsed.data.code.trim().toUpperCase(),
        seats: parsed.data.seats,
        section: parsed.data.section?.trim() || null,
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder,
        shape: "CLOUD",
        posX: 60 + col * 160,
        posY: 60 + row * 140,
      },
    });

    await auditFromTenant(tenant, {
      action: "table.created",
      entityType: "table",
      entityId: table.id,
      summary: `Created table ${table.code} (${table.seats} seats)`,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A table with this code already exists." };
    }
    throw error;
  }

  revalidatePath("/tables");
  revalidatePath("/pos");
  revalidatePath("/activity");
  return { success: "Table created." };
}

export async function updateTableAction(
  tableId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("tables:write");
  const existing = await db.diningTable.findFirst({
    where: { id: tableId, organizationId: tenant.organizationId },
  });
  if (!existing) return { error: "Table not found." };

  const parsed = tableSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    seats: String(formData.get("seats") ?? "4"),
    section: String(formData.get("section") ?? ""),
    status: String(formData.get("status") ?? existing.status),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  });
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await db.diningTable.update({
      where: { id: tableId },
      data: {
        name: parsed.data.name.trim(),
        code: parsed.data.code.trim().toUpperCase(),
        seats: parsed.data.seats,
        section: parsed.data.section?.trim() || null,
        status: parsed.data.status,
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A table with this code already exists." };
    }
    throw error;
  }

  await auditFromTenant(tenant, {
    action: "table.updated",
    entityType: "table",
    entityId: tableId,
    summary: `Updated table ${parsed.data.code.trim().toUpperCase()}`,
  });

  revalidatePath("/tables");
  revalidatePath("/pos");
  revalidatePath("/activity");
  return { success: "Table updated." };
}

export async function updateTablePositionAction(
  tableId: string,
  posX: number,
  posY: number,
) {
  const tenant = await requirePermission("tables:write");
  const existing = await db.diningTable.findFirst({
    where: { id: tableId, organizationId: tenant.organizationId },
    select: { id: true },
  });
  if (!existing) return { error: "Table not found." };

  const x = Math.max(16, Math.min(2200, posX));
  const y = Math.max(16, Math.min(1400, posY));

  try {
    await db.diningTable.update({
      where: { id: tableId },
      data: { posX: x, posY: y },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unknown argument `posX`")) {
      return {
        error:
          "Table layout fields are out of date. Restart the dev server, then try again.",
      };
    }
    throw error;
  }

  // Silent save — avoid full page revalidation on every drag.
  return { success: true };
}

export async function autoArrangeTablesAction() {
  const tenant = await requirePermission("tables:write");
  const tables = await db.diningTable.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
    select: { id: true },
  });

  try {
    await Promise.all(
      tables.map((table, index) => {
        const { posX, posY } = floorGridPosition(index);
        return db.diningTable.update({
          where: { id: table.id },
          data: { posX, posY },
        });
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Unknown argument `posX`")) {
      return {
        error:
          "Table layout fields are out of date. Restart the dev server, then try again.",
      };
    }
    throw error;
  }

  revalidatePath("/tables");
  return { success: true as const, count: tables.length };
}

export async function setTableStatusAction(tableId: string, status: TableStatus) {
  const tenant = await requirePermission("tables:write");
  const existing = await db.diningTable.findFirst({
    where: { id: tableId, organizationId: tenant.organizationId },
  });
  if (!existing) throw new Error("Table not found.");

  await db.diningTable.update({
    where: { id: tableId },
    data: { status },
  });

  await auditFromTenant(tenant, {
    action: "table.status_changed",
    entityType: "table",
    entityId: tableId,
    summary: `${existing.code}: ${existing.status} → ${status}`,
  });

  revalidatePath("/tables");
  revalidatePath("/pos");
  revalidatePath("/activity");
}

export async function deleteTableAction(tableId: string) {
  const tenant = await requirePermission("tables:delete");
  const existing = await db.diningTable.findFirst({
    where: { id: tableId, organizationId: tenant.organizationId },
    include: {
      _count: {
        select: {
          orders: { where: { status: { in: ["DRAFT", "PENDING", "CONFIRMED"] } } },
        },
      },
    },
  });
  if (!existing) throw new Error("Table not found.");
  if (existing._count.orders > 0) {
    throw new Error("Clear open orders on this table before deleting.");
  }

  await db.diningTable.delete({ where: { id: tableId } });
  await auditFromTenant(tenant, {
    action: "table.deleted",
    entityType: "table",
    entityId: tableId,
    summary: `Deleted table ${existing.code}`,
  });

  revalidatePath("/tables");
  revalidatePath("/pos");
  revalidatePath("/activity");
}
