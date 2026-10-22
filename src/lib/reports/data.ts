import { db } from "@/lib/db";
import { formatMoney } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import type { ReportRow, ReportType } from "@/lib/reports/types";
import type { OrderStatus, OrderType } from "@/generated/prisma/client";

const TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: "Dine-in",
  TAKEAWAY: "Takeaway",
  DELIVERY: "Delivery",
};

export type DateRange = { from: Date; to: Date };

export function parseReportRange(from?: string, to?: string): DateRange {
  const end = to ? new Date(`${to}T23:59:59.999`) : new Date();
  const start = from
    ? new Date(`${from}T00:00:00.000`)
    : new Date(end.getTime() - 29 * 24 * 60 * 60 * 1000);
  start.setHours(0, 0, 0, 0);
  return { from: start, to: end };
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function buildReportRows(
  organizationId: string,
  type: ReportType,
  range: DateRange,
): Promise<ReportRow[]> {
  const where = {
    organizationId,
    createdAt: { gte: range.from, lte: range.to },
  };

  if (type === "sales") {
    const orders = await db.order.findMany({
      where,
      select: {
        createdAt: true,
        totalCents: true,
        status: true,
        currency: true,
      },
    });
    const byDay = new Map<
      string,
      {
        orders: number;
        revenue: number;
        fulfilled: number;
        cancelled: number;
        currency: string;
      }
    >();
    for (const order of orders) {
      const key = dayKey(order.createdAt);
      const row = byDay.get(key) ?? {
        orders: 0,
        revenue: 0,
        fulfilled: 0,
        cancelled: 0,
        currency: order.currency,
      };
      row.orders += 1;
      if (order.status === "FULFILLED" || order.status === "CONFIRMED" || order.status === "READY") {
        row.revenue += order.totalCents;
      }
      if (order.status === "FULFILLED") row.fulfilled += 1;
      if (order.status === "CANCELLED") row.cancelled += 1;
      byDay.set(key, row);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, row]) => ({
        date,
        orders: row.orders,
        revenue: formatMoney(row.revenue, row.currency),
        avgTicket: formatMoney(
          row.orders ? Math.round(row.revenue / row.orders) : 0,
          row.currency,
        ),
        fulfilled: row.fulfilled,
        cancelled: row.cancelled,
      }));
  }

  if (type === "orders") {
    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { name: true } },
        items: { select: { quantity: true } },
      },
      take: 2000,
    });
    return orders.map((order) => ({
      orderNumber: order.orderNumber,
      date: order.createdAt.toLocaleString(),
      status: ORDER_STATUS_LABELS[order.status as OrderStatus],
      orderType: TYPE_LABEL[order.orderType],
      customer: order.customer?.name ?? "Walk-in",
      items: order.items.reduce((sum, i) => sum + i.quantity, 0),
      total: formatMoney(order.totalCents, order.currency),
    }));
  }

  if (type === "products") {
    const orderItems = await db.orderItem.findMany({
      where: {
        order: {
          organizationId,
          createdAt: { gte: range.from, lte: range.to },
          status: { not: "CANCELLED" },
        },
      },
      select: {
        quantity: true,
        totalCents: true,
        productName: true,
        productSku: true,
        orderId: true,
      },
    });

    const map = new Map<
      string,
      {
        product: string;
        sku: string;
        qty: number;
        revenue: number;
        orders: Set<string>;
      }
    >();
    for (const item of orderItems) {
      const key = item.productSku;
      const row = map.get(key) ?? {
        product: item.productName,
        sku: item.productSku,
        qty: 0,
        revenue: 0,
        orders: new Set<string>(),
      };
      row.qty += item.quantity;
      row.revenue += item.totalCents;
      row.orders.add(item.orderId);
      map.set(key, row);
    }
    return [...map.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .map((row) => ({
        product: row.product,
        sku: row.sku,
        qty: row.qty,
        revenue: formatMoney(row.revenue),
        orders: row.orders.size,
      }));
  }

  if (type === "customers") {
    const orders = await db.order.findMany({
      where: {
        ...where,
        customerId: { not: null },
        status: { not: "CANCELLED" },
      },
      select: {
        totalCents: true,
        createdAt: true,
        currency: true,
        customer: {
          select: { name: true, phone: true, email: true },
        },
      },
    });
    const map = new Map<
      string,
      {
        customer: string;
        phone: string;
        email: string;
        orders: number;
        spent: number;
        lastOrder: Date;
        currency: string;
      }
    >();
    for (const order of orders) {
      if (!order.customer) continue;
      const key = `${order.customer.name}|${order.customer.phone ?? ""}|${order.customer.email ?? ""}`;
      const row = map.get(key) ?? {
        customer: order.customer.name,
        phone: order.customer.phone ?? "",
        email: order.customer.email ?? "",
        orders: 0,
        spent: 0,
        lastOrder: order.createdAt,
        currency: order.currency,
      };
      row.orders += 1;
      row.spent += order.totalCents;
      if (order.createdAt > row.lastOrder) row.lastOrder = order.createdAt;
      map.set(key, row);
    }
    return [...map.values()]
      .sort((a, b) => b.spent - a.spent)
      .map((row) => ({
        customer: row.customer,
        phone: row.phone || "—",
        email: row.email || "—",
        orders: row.orders,
        spent: formatMoney(row.spent, row.currency),
        lastOrder: row.lastOrder.toLocaleDateString(),
      }));
  }

  // order-types
  const orders = await db.order.findMany({
    where: { ...where, status: { not: "CANCELLED" } },
    select: { orderType: true, totalCents: true, currency: true },
  });
  const map = new Map<
    OrderType,
    { orders: number; revenue: number; currency: string }
  >();
  for (const order of orders) {
    const row = map.get(order.orderType) ?? {
      orders: 0,
      revenue: 0,
      currency: order.currency,
    };
    row.orders += 1;
    row.revenue += order.totalCents;
    map.set(order.orderType, row);
  }
  const totalOrders = orders.length || 1;
  return (["DINE_IN", "TAKEAWAY", "DELIVERY"] as OrderType[]).map((type) => {
    const row = map.get(type) ?? { orders: 0, revenue: 0, currency: "USD" };
    return {
      orderType: TYPE_LABEL[type],
      orders: row.orders,
      revenue: formatMoney(row.revenue, row.currency),
      share: `${Math.round((row.orders / totalOrders) * 100)}%`,
    };
  });
}

export async function getDashboardAnalytics(organizationId: string) {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 13);
  from.setHours(0, 0, 0, 0);

  const [
    customerCount,
    productCount,
    orderCount,
    revenue,
    recentOrders,
    statusGroups,
    typeGroups,
    lowStock,
    rangeOrders,
    topItems,
  ] = await Promise.all([
    db.customer.count({
      where: { organizationId, archivedAt: null },
    }),
    db.product.count({
      where: { organizationId, archivedAt: null, active: true },
    }),
    db.order.count({ where: { organizationId } }),
    db.order.aggregate({
      where: {
        organizationId,
        status: { in: ["CONFIRMED", "READY", "FULFILLED"] },
      },
      _sum: { totalCents: true },
    }),
    db.order.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { customer: { select: { name: true } } },
    }),
    db.order.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { _all: true },
    }),
    db.order.groupBy({
      by: ["orderType"],
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        createdAt: { gte: from },
      },
      _count: { _all: true },
      _sum: { totalCents: true },
    }),
    db.product.findMany({
      where: {
        organizationId,
        trackStock: true,
        archivedAt: null,
        stockQty: { lte: 5 },
      },
      orderBy: { stockQty: "asc" },
      take: 5,
    }),
    db.order.findMany({
      where: {
        organizationId,
        createdAt: { gte: from },
      },
      select: {
        createdAt: true,
        totalCents: true,
        status: true,
      },
    }),
    db.orderItem.findMany({
      where: {
        order: {
          organizationId,
          createdAt: { gte: from },
          status: { not: "CANCELLED" },
        },
      },
      select: {
        productName: true,
        quantity: true,
        totalCents: true,
      },
      take: 5000,
    }),
  ]);

  const revenueByDayMap = new Map<string, { revenue: number; orders: number }>();
  for (let i = 0; i < 14; i++) {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    revenueByDayMap.set(dayKey(d), { revenue: 0, orders: 0 });
  }
  for (const order of rangeOrders) {
    const key = dayKey(order.createdAt);
    const row = revenueByDayMap.get(key);
    if (!row) continue;
    row.orders += 1;
    if (["CONFIRMED", "READY", "FULFILLED"].includes(order.status)) {
      row.revenue += order.totalCents;
    }
  }
  const revenueByDay = [...revenueByDayMap.entries()].map(([date, row]) => ({
    date: date.slice(5),
    revenue: row.revenue / 100,
    orders: row.orders,
  }));

  const statusChart = statusGroups.map((g) => ({
    status: ORDER_STATUS_LABELS[g.status],
    count: g._count._all,
  }));

  const typeChart = typeGroups.map((g) => ({
    type: TYPE_LABEL[g.orderType],
    orders: g._count._all,
    revenue: (g._sum.totalCents ?? 0) / 100,
  }));

  const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of topItems) {
    const row = productMap.get(item.productName) ?? {
      name: item.productName,
      qty: 0,
      revenue: 0,
    };
    row.qty += item.quantity;
    row.revenue += item.totalCents;
    productMap.set(item.productName, row);
  }
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 6)
    .map((p) => ({
      name: p.name.length > 18 ? `${p.name.slice(0, 16)}…` : p.name,
      qty: p.qty,
      revenue: p.revenue / 100,
    }));

  const todayKey = dayKey(now);
  const today = revenueByDayMap.get(todayKey) ?? { revenue: 0, orders: 0 };

  return {
    stats: {
      customerCount,
      productCount,
      orderCount,
      revenueCents: revenue._sum.totalCents ?? 0,
      todayOrders: today.orders,
      todayRevenueCents: today.revenue,
    },
    recentOrders,
    statusGroups,
    lowStock,
    charts: {
      revenueByDay,
      statusChart,
      typeChart,
      topProducts,
    },
  };
}
