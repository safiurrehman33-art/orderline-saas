import Link from "next/link";
import {
  ArrowUpRight,
  Package,
  ShoppingCart,
  Users,
  CircleDollarSign,
  TrendingUp,
  FileBarChart2,
} from "lucide-react";
import { requireTenant } from "@/lib/tenant";
import { getRecentActivity } from "@/lib/actions/activity";
import { getDashboardAnalytics } from "@/lib/reports/data";
import { formatMoney } from "@/lib/utils";
import { PageHeader } from "@/components/ui/page-header";
import { OrderStatusBadge } from "@/components/orders/status-badge";
import { Badge } from "@/components/ui/badge";
import { ActivityItem } from "@/components/activity/activity-item";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const tenant = await requireTenant();
  const [analytics, recentActivity] = await Promise.all([
    getDashboardAnalytics(tenant.organizationId),
    getRecentActivity(8),
  ]);

  const { stats, recentOrders, statusGroups, lowStock, charts } = analytics;

  const cards = [
    {
      label: "Today’s revenue",
      value: formatMoney(stats.todayRevenueCents),
      hint: `${stats.todayOrders} orders today`,
      href: "/reports/sales",
      icon: TrendingUp,
    },
    {
      label: "Recognized revenue",
      value: formatMoney(stats.revenueCents),
      hint: "Confirmed · ready · fulfilled",
      href: "/reports/sales",
      icon: CircleDollarSign,
    },
    {
      label: "Orders",
      value: stats.orderCount.toLocaleString(),
      hint: "All time",
      href: "/orders",
      icon: ShoppingCart,
    },
    {
      label: "Customers",
      value: stats.customerCount.toLocaleString(),
      hint: `${stats.productCount} active products`,
      href: "/customers",
      icon: Users,
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back${tenant.name ? `, ${tenant.name.split(" ")[0]}` : ""}`}
        description={`${tenant.organizationName} · role ${tenant.role}`}
        actionHref="/pos"
        actionLabel="Open POS"
      >
        <Link href="/reports">
          <Button variant="outline" size="sm">
            <FileBarChart2 className="h-3.5 w-3.5" />
            Reports
          </Button>
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-2xl border border-line bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted">{stat.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight">
                {stat.value}
              </p>
              <p className="mt-1 text-xs text-muted">{stat.hint}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
                View <ArrowUpRight className="h-3 w-3" />
              </p>
            </Link>
          );
        })}
      </div>

      <DashboardCharts charts={charts} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-line bg-surface shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/orders" className="text-sm text-accent hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-line">
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-sm text-muted">
                No orders yet. Open POS to take the first ticket.
              </p>
            ) : (
              recentOrders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-accent-soft/40"
                >
                  <div>
                    <p className="font-medium">{order.orderNumber}</p>
                    <p className="text-xs text-muted">
                      {order.customer?.name ?? "Walk-in"} ·{" "}
                      {order.createdAt.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <p className="text-sm font-medium">
                      {formatMoney(order.totalCents, order.currency)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <h2 className="font-semibold">Pipeline</h2>
            <ul className="mt-4 space-y-2">
              {statusGroups.length === 0 ? (
                <li className="text-sm text-muted">No status data yet.</li>
              ) : (
                statusGroups.map((group) => (
                  <li
                    key={group.status}
                    className="flex items-center justify-between text-sm"
                  >
                    <OrderStatusBadge status={group.status} />
                    <span className="font-medium">{group._count._all}</span>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Low stock</h2>
              <Package className="h-4 w-4 text-muted" />
            </div>
            <ul className="mt-4 space-y-3">
              {lowStock.length === 0 ? (
                <li className="text-sm text-muted">
                  No tracked products are low.
                </li>
              ) : (
                lowStock.map((product) => (
                  <li
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <Link
                        href={`/products/${product.id}`}
                        className="text-sm font-medium hover:text-accent"
                      >
                        {product.name}
                      </Link>
                      <p className="text-xs text-muted">{product.sku}</p>
                    </div>
                    <Badge tone={product.stockQty === 0 ? "danger" : "warning"}>
                      {product.stockQty} left
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-line bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">Activity feed</h2>
          <Link href="/activity" className="text-sm text-accent hover:underline">
            Full audit log
          </Link>
        </div>
        {recentActivity.length === 0 ? (
          <p className="px-5 py-10 text-sm text-muted">
            No audit events yet. Actions across the workspace will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {recentActivity.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
