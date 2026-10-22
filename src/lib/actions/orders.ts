"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { orderSchema, orderStatusSchema } from "@/lib/validations/order";
import type { ActionState } from "@/lib/actions/auth";
import {
  canTransition,
  isOrderLocked,
  ORDER_STATUS_LABELS,
} from "@/lib/orders/status";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { auditFromTenant } from "@/lib/audit";
import { computeOrderTotals, pricingFromOrg } from "@/lib/pricing";

async function nextOrderNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const latest = await db.order.findFirst({
    where: {
      organizationId,
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });

  const lastSeq = latest
    ? Number.parseInt(latest.orderNumber.replace(prefix, ""), 10)
    : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function createOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState & { orderId?: string }> {
  const tenant = await requirePermission("orders:write");

  let items: { productId: string; quantity: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Invalid line items payload." };
  }

  const parsed = orderSchema.safeParse({
    customerId: String(formData.get("customerId") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items,
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid order.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: productIds },
      archivedAt: null,
      active: true,
    },
  });

  if (products.length !== new Set(productIds).size) {
    return { error: "One or more products are invalid or inactive." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    const totalCents = product.priceCents * item.quantity;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitCents: product.priceCents,
      totalCents,
      productName: product.name,
      productSku: product.sku,
    };
  });

  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const org = await db.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
    select: {
      taxEnabled: true,
      salesTaxPercent: true,
      vatPercent: true,
      serviceChargePercent: true,
      pricesIncludeTax: true,
    },
  });
  const totals = computeOrderTotals(subtotalCents, pricingFromOrg(org));
  const customerId = parsed.data.customerId || null;

  if (customerId) {
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        organizationId: tenant.organizationId,
        archivedAt: null,
      },
    });
    if (!customer) return { error: "Customer not found." };
  }

  const orderNumber = await nextOrderNumber(tenant.organizationId);

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        organizationId: tenant.organizationId,
        orderNumber,
        customerId,
        notes: parsed.data.notes?.trim() || null,
        subtotalCents: totals.subtotalCents,
        salesTaxCents: totals.salesTaxCents,
        vatCents: totals.vatCents,
        serviceCents: totals.serviceCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        status: "DRAFT",
        items: { create: lineItems },
        statusEvents: {
          create: {
            toStatus: "DRAFT",
            note: "Order created",
            createdBy: tenant.userId,
          },
        },
      },
    });

    for (const item of lineItems) {
      const product = productMap.get(item.productId)!;
      if (product.trackStock) {
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { decrement: item.quantity } },
        });
      }
    }

    return created;
  });

  await auditFromTenant(tenant, {
    action: "order.created",
    entityType: "order",
    entityId: order.id,
    summary: `Created order ${order.orderNumber}`,
    metadata: { itemCount: lineItems.length, totalCents: totals.totalCents },
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Order created.", orderId: order.id };
}

export async function updateOrderAction(
  orderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("orders:write");

  const existing = await db.order.findFirst({
    where: { id: orderId, organizationId: tenant.organizationId },
    include: { items: true },
  });
  if (!existing) return { error: "Order not found." };
  if (isOrderLocked(existing.status) || existing.status === "CONFIRMED") {
    return { error: "This order can no longer be edited. Change status first." };
  }

  let items: { productId: string; quantity: number }[] = [];
  try {
    items = JSON.parse(String(formData.get("itemsJson") ?? "[]"));
  } catch {
    return { error: "Invalid line items payload." };
  }

  const parsed = orderSchema.safeParse({
    customerId: String(formData.get("customerId") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    items,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order." };
  }

  const productIds = parsed.data.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: productIds },
      archivedAt: null,
    },
  });
  if (products.length !== new Set(productIds).size) {
    return { error: "One or more products are invalid." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineItems = parsed.data.items.map((item) => {
    const product = productMap.get(item.productId)!;
    return {
      productId: product.id,
      quantity: item.quantity,
      unitCents: product.priceCents,
      totalCents: product.priceCents * item.quantity,
      productName: product.name,
      productSku: product.sku,
    };
  });
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const org = await db.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
    select: {
      taxEnabled: true,
      salesTaxPercent: true,
      vatPercent: true,
      serviceChargePercent: true,
      pricesIncludeTax: true,
    },
  });
  const totals = computeOrderTotals(subtotalCents, pricingFromOrg(org));
  const customerId = parsed.data.customerId || null;

  await db.$transaction(async (tx) => {
    // restore previous stock
    for (const old of existing.items) {
      const product = await tx.product.findUnique({ where: { id: old.productId } });
      if (product?.trackStock) {
        await tx.product.update({
          where: { id: old.productId },
          data: { stockQty: { increment: old.quantity } },
        });
      }
    }

    await tx.orderItem.deleteMany({ where: { orderId } });
    await tx.order.update({
      where: { id: orderId },
      data: {
        customerId,
        notes: parsed.data.notes?.trim() || null,
        subtotalCents: totals.subtotalCents,
        salesTaxCents: totals.salesTaxCents,
        vatCents: totals.vatCents,
        serviceCents: totals.serviceCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        items: { create: lineItems },
      },
    });

    for (const item of lineItems) {
      const product = productMap.get(item.productId)!;
      if (product.trackStock) {
        await tx.product.update({
          where: { id: product.id },
          data: { stockQty: { decrement: item.quantity } },
        });
      }
    }
  });

  await auditFromTenant(tenant, {
    action: "order.updated",
    entityType: "order",
    entityId: orderId,
    summary: `Updated order ${existing.orderNumber}`,
    metadata: { itemCount: lineItems.length, totalCents: totals.totalCents },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Order updated." };
}

export async function transitionOrderStatusAction(
  orderId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("orders:transition");
  const parsed = orderStatusSchema.safeParse({
    status: String(formData.get("status") ?? ""),
    note: String(formData.get("note") ?? ""),
  });
  if (!parsed.success) return { error: "Invalid status." };

  const order = await db.order.findFirst({
    where: { id: orderId, organizationId: tenant.organizationId },
  });
  if (!order) return { error: "Order not found." };

  const toStatus = parsed.data.status as OrderStatus;
  if (order.status === toStatus) return { success: "Status unchanged." };
  if (!canTransition(order.status, toStatus)) {
    return {
      error: `Cannot move from ${order.status} to ${toStatus}.`,
    };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        placedAt:
          toStatus === "PENDING" || toStatus === "CONFIRMED"
            ? order.placedAt ?? now
            : order.placedAt,
        fulfilledAt: toStatus === "FULFILLED" ? now : order.fulfilledAt,
        cancelledAt: toStatus === "CANCELLED" ? now : null,
      },
    });
    await tx.orderStatusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        note: parsed.data.note?.trim() || null,
        createdBy: tenant.userId,
      },
    });

    if (
      order.tableId &&
      (toStatus === "FULFILLED" || toStatus === "CANCELLED")
    ) {
      await tx.diningTable.update({
        where: { id: order.tableId },
        data: { status: "AVAILABLE" },
      });
    }
  });

  await auditFromTenant(tenant, {
    action: "order.status_changed",
    entityType: "order",
    entityId: orderId,
    summary: `${order.orderNumber}: ${order.status} → ${toStatus}`,
    metadata: {
      fromStatus: order.status,
      toStatus,
      note: parsed.data.note?.trim() || null,
    },
  });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
  revalidatePath("/tables");
  revalidatePath("/pos");
  revalidatePath("/kitchen");
  revalidatePath("/activity");
  return {
    success: `Order marked ${ORDER_STATUS_LABELS[toStatus].toLowerCase()}.`,
  };
}

export async function deleteOrderAction(orderId: string) {
  const tenant = await requirePermission("orders:delete");
  const order = await db.order.findFirst({
    where: { id: orderId, organizationId: tenant.organizationId },
    include: { items: true },
  });
  if (!order) throw new Error("Order not found.");
  if (order.status !== "DRAFT" && order.status !== "CANCELLED") {
    throw new Error("Only draft or cancelled orders can be deleted.");
  }

  await db.$transaction(async (tx) => {
    for (const item of order.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (product?.trackStock) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQty: { increment: item.quantity } },
        });
      }
    }
    await tx.order.delete({ where: { id: orderId } });
  });

  await auditFromTenant(tenant, {
    action: "order.deleted",
    entityType: "order",
    entityId: orderId,
    summary: `Deleted order ${order.orderNumber}`,
  });

  revalidatePath("/orders");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/activity");
}

export async function duplicateOrderAction(orderId: string) {
  const tenant = await requirePermission("orders:write");
  const source = await db.order.findFirst({
    where: { id: orderId, organizationId: tenant.organizationId },
    include: { items: true },
  });
  if (!source) throw new Error("Order not found.");

  const orderNumber = await nextOrderNumber(tenant.organizationId);
  const created = await db.order.create({
    data: {
      organizationId: tenant.organizationId,
      orderNumber,
      customerId: source.customerId,
      notes: source.notes,
      subtotalCents: source.subtotalCents,
      salesTaxCents: source.salesTaxCents,
      vatCents: source.vatCents,
      serviceCents: source.serviceCents,
      taxCents: source.taxCents,
      totalCents: source.totalCents,
      currency: source.currency,
      status: "DRAFT",
      items: {
        create: source.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitCents: item.unitCents,
          totalCents: item.totalCents,
          productName: item.productName,
          productSku: item.productSku,
        })),
      },
      statusEvents: {
        create: {
          toStatus: "DRAFT",
          note: `Duplicated from ${source.orderNumber}`,
          createdBy: tenant.userId,
        },
      },
    },
  });

  await auditFromTenant(tenant, {
    action: "order.duplicated",
    entityType: "order",
    entityId: created.id,
    summary: `Duplicated ${source.orderNumber} → ${created.orderNumber}`,
    metadata: { sourceOrderId: source.id },
  });

  revalidatePath("/orders");
  revalidatePath("/activity");
  return created.id;
}

export async function listOrders(params: {
  q?: string;
  status?: OrderStatus | "ALL";
  customerId?: string;
  page?: number;
  pageSize?: number;
  sort?: "createdAt" | "totalCents" | "orderNumber" | "status";
  dir?: "asc" | "desc";
  from?: string;
  to?: string;
}) {
  const tenant = await requirePermission("orders:read");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 10));
  const sort = params.sort ?? "createdAt";
  const dir = params.dir ?? "desc";

  const where: Prisma.OrderWhereInput = {
    organizationId: tenant.organizationId,
  };

  if (params.status && params.status !== "ALL") {
    where.status = params.status;
  }
  if (params.customerId) {
    where.customerId = params.customerId;
  }
  if (params.from || params.to) {
    where.createdAt = {};
    if (params.from) where.createdAt.gte = new Date(params.from);
    if (params.to) {
      const end = new Date(params.to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, items] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
