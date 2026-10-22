"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { auditFromTenant } from "@/lib/audit";
import { canTransition, ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { computeOrderTotals, pricingFromOrg } from "@/lib/pricing";
import { OrderStatus, type OrderType } from "@/generated/prisma/client";

async function nextOrderNumber(organizationId: string) {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const latest = await db.order.findFirst({
    where: { organizationId, orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
    select: { orderNumber: true },
  });
  const lastSeq = latest
    ? Number.parseInt(latest.orderNumber.replace(prefix, ""), 10)
    : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(next).padStart(5, "0")}`;
}

export async function getPosCatalog() {
  const tenant = await requirePermission("pos:use");

  const [categories, products, tables, deals, customers, organization] =
    await Promise.all([
      db.category.findMany({
        where: { organizationId: tenant.organizationId, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      }),
      db.product.findMany({
        where: {
          organizationId: tenant.organizationId,
          active: true,
          archivedAt: null,
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { category: { select: { id: true, name: true, color: true } } },
      }),
      db.diningTable.findMany({
        where: { organizationId: tenant.organizationId },
        orderBy: [{ section: "asc" }, { sortOrder: "asc" }, { code: "asc" }],
      }),
      db.deal.findMany({
        where: { organizationId: tenant.organizationId, active: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true, priceCents: true },
              },
            },
          },
        },
      }),
      db.customer.findMany({
        where: { organizationId: tenant.organizationId, archivedAt: null },
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
        },
        take: 500,
      }),
      db.organization.findUniqueOrThrow({
        where: { id: tenant.organizationId },
        select: {
          taxEnabled: true,
          salesTaxPercent: true,
          vatPercent: true,
          serviceChargePercent: true,
          pricesIncludeTax: true,
          logoUrl: true,
        },
      }),
    ]);

  return {
    tenant,
    categories,
    products,
    tables,
    deals,
    customers,
    pricing: pricingFromOrg(organization),
    logoUrl: organization.logoUrl,
  };
}

export async function placePosOrderAction(input: {
  orderType: OrderType;
  tableId?: string | null;
  customerId?: string | null;
  guestCount?: number;
  notes?: string;
  items: { productId: string; quantity: number }[];
}) {
  const tenant = await requirePermission("pos:use");

  if (!input.items?.length) {
    return { error: "Add at least one item." };
  }
  if (input.orderType === "DINE_IN" && !input.tableId) {
    return { error: "Select a table for dine-in orders." };
  }
  if (input.orderType === "DELIVERY" && !input.customerId) {
    return { error: "Select a customer for delivery orders." };
  }

  let customerId: string | null = null;
  let receiptCustomer: {
    name: string;
    phone: string | null;
    address: string | null;
  } | null = null;
  if (input.customerId) {
    const customer = await db.customer.findFirst({
      where: {
        id: input.customerId,
        organizationId: tenant.organizationId,
        archivedAt: null,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
      },
    });
    if (!customer) return { error: "Customer not found." };
    if (
      input.orderType === "DELIVERY" &&
      !customer.addressLine1?.trim()
    ) {
      return {
        error:
          "Selected customer has no delivery address. Add one under Customers first.",
      };
    }
    customerId = customer.id;
    receiptCustomer = {
      name: customer.name,
      phone: customer.phone,
      address: [
        customer.addressLine1,
        customer.addressLine2,
        [customer.city, customer.state, customer.postalCode]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(", "),
    };
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: productIds },
      active: true,
      archivedAt: null,
    },
  });
  if (products.length !== new Set(productIds).size) {
    return { error: "One or more menu items are unavailable." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const lineItems = input.items.map((item) => {
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
  const subtotalCents = lineItems.reduce((sum, i) => sum + i.totalCents, 0);
  const org = await db.organization.findUniqueOrThrow({
    where: { id: tenant.organizationId },
    select: {
      name: true,
      logoUrl: true,
      taxEnabled: true,
      salesTaxPercent: true,
      vatPercent: true,
      serviceChargePercent: true,
      pricesIncludeTax: true,
    },
  });
  const pricing = pricingFromOrg(org);
  const totals = computeOrderTotals(subtotalCents, pricing);

  let tableId: string | null = null;
  let tableCode: string | null = null;
  if (input.orderType === "DINE_IN" && input.tableId) {
    const table = await db.diningTable.findFirst({
      where: { id: input.tableId, organizationId: tenant.organizationId },
    });
    if (!table) return { error: "Table not found." };
    if (table.status === "OCCUPIED") {
      return { error: `Table ${table.code} is already occupied.` };
    }
    tableId = table.id;
    tableCode = table.code;
  }

  const orderNumber = await nextOrderNumber(tenant.organizationId);
  const now = new Date();

  const order = await db.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        organizationId: tenant.organizationId,
        orderNumber,
        orderType: input.orderType,
        tableId,
        customerId,
        guestCount: Math.max(1, input.guestCount ?? 1),
        notes: input.notes?.trim() || null,
        subtotalCents: totals.subtotalCents,
        salesTaxCents: totals.salesTaxCents,
        vatCents: totals.vatCents,
        serviceCents: totals.serviceCents,
        taxCents: totals.taxCents,
        totalCents: totals.totalCents,
        status: "PENDING",
        placedAt: now,
        items: { create: lineItems },
        statusEvents: {
          create: [
            {
              toStatus: "DRAFT",
              note: "POS ticket opened",
              createdBy: tenant.userId,
            },
            {
              fromStatus: "DRAFT",
              toStatus: "PENDING",
              note: "Sent from POS",
              createdBy: tenant.userId,
            },
          ],
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

    if (tableId) {
      await tx.diningTable.update({
        where: { id: tableId },
        data: { status: "OCCUPIED" },
      });
    }

    return created;
  });

  await auditFromTenant(tenant, {
    action: "pos.order_placed",
    entityType: "order",
    entityId: order.id,
    summary: `POS ${order.orderNumber} (${input.orderType}) · ${formatItems(lineItems.length)}`,
    metadata: {
      orderType: input.orderType,
      tableId,
      customerId,
      totalCents: totals.totalCents,
      taxCents: totals.taxCents,
    },
  });

  revalidatePath("/pos");
  revalidatePath("/kitchen");
  revalidatePath("/orders");
  revalidatePath("/tables");
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/products");

  return {
    success: "Order sent to kitchen.",
    orderId: order.id,
    orderNumber,
    receipt: {
      orderId: order.id,
      orderNumber,
      organizationName: org.name,
      logoUrl: org.logoUrl,
      orderType: input.orderType,
      tableCode,
      guestCount: Math.max(1, input.guestCount ?? 1),
      notes: input.notes?.trim() || null,
      placedAt: now.toISOString(),
      cashierName: tenant.name,
      customer: receiptCustomer,
      items: lineItems.map((item) => ({
        name: item.productName,
        sku: item.productSku,
        quantity: item.quantity,
        unitCents: item.unitCents,
        totalCents: item.totalCents,
      })),
      pricing,
      ...totals,
    },
  };
}

export type PosReceiptData = NonNullable<
  Awaited<ReturnType<typeof placePosOrderAction>> extends { receipt?: infer R }
    ? R
    : never
>;


export async function getKitchenOrders() {
  const tenant = await requirePermission("pos:use");

  const orders = await db.order.findMany({
    where: {
      organizationId: tenant.organizationId,
      status: {
        in: [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.READY,
        ],
      },
    },
    orderBy: [{ placedAt: "asc" }, { createdAt: "asc" }],
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          state: true,
          postalCode: true,
        },
      },
      table: { select: { id: true, code: true, name: true } },
      items: {
        orderBy: { productName: "asc" },
        include: {
          product: { select: { imageUrl: true } },
        },
      },
    },
  });

  return { tenant, orders };
}

export async function kitchenAdvanceOrderAction(
  orderId: string,
  toStatus: "CONFIRMED" | "READY" | "FULFILLED" | "CANCELLED",
) {
  const tenant = await requirePermission("pos:use");

  const order = await db.order.findFirst({
    where: { id: orderId, organizationId: tenant.organizationId },
  });
  if (!order) return { error: "Order not found." };

  if (!canTransition(order.status, toStatus)) {
    return {
      error: `Cannot move from ${ORDER_STATUS_LABELS[order.status]} to ${ORDER_STATUS_LABELS[toStatus]}.`,
    };
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: toStatus,
        fulfilledAt: toStatus === "FULFILLED" ? now : order.fulfilledAt,
        cancelledAt: toStatus === "CANCELLED" ? now : null,
      },
    });
    await tx.orderStatusEvent.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        note: "Updated from kitchen display",
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
    action: "kitchen.status_changed",
    entityType: "order",
    entityId: orderId,
    summary: `${order.orderNumber}: ${order.status} → ${toStatus}`,
    metadata: { fromStatus: order.status, toStatus },
  });

  revalidatePath("/kitchen");
  revalidatePath("/pos");
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/tables");
  revalidatePath("/dashboard");
  revalidatePath("/activity");

  return {
    success: `${order.orderNumber} → ${ORDER_STATUS_LABELS[toStatus]}`,
  };
}

function formatItems(count: number) {
  return `${count} item${count === 1 ? "" : "s"}`;
}
