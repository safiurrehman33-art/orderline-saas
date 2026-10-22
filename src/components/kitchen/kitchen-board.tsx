"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Bike,
  CheckCircle2,
  ChefHat,
  Clock3,
  Flame,
  MapPin,
  RefreshCw,
  ShoppingBag,
  Store,
  Timer,
  Trash2,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";
import { kitchenAdvanceOrderAction } from "@/lib/actions/pos";
import { completeActionLabel } from "@/lib/orders/status";
import type { OrderStatus, OrderType } from "@/generated/prisma/client";

type KitchenOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderType: OrderType;
  guestCount: number;
  notes: string | null;
  totalCents: number;
  currency: string;
  placedAt: Date | string | null;
  createdAt: Date | string;
  customer: {
    id: string;
    name: string;
    phone: string | null;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  } | null;
  table: { id: string; code: string; name: string } | null;
  items: {
    id: string;
    quantity: number;
    productName: string;
    productSku: string;
    totalCents: number;
    product: { imageUrl: string | null };
  }[];
};

const COLUMNS: {
  status: OrderStatus;
  title: string;
  hint: string;
  icon: typeof Flame;
  tone: {
    bar: string;
    glow: string;
    badge: string;
    empty: string;
    action: string;
  };
}[] = [
  {
    status: "PENDING",
    title: "New",
    hint: "Awaiting kitchen",
    icon: Flame,
    tone: {
      bar: "from-amber-400 to-orange-500",
      glow: "shadow-amber-500/10",
      badge: "bg-amber-400/15 text-amber-200 ring-amber-400/30",
      empty: "border-amber-400/20",
      action: "bg-amber-500 hover:bg-amber-400 text-black",
    },
  },
  {
    status: "CONFIRMED",
    title: "Preparing",
    hint: "On the line",
    icon: ChefHat,
    tone: {
      bar: "from-sky-400 to-blue-500",
      glow: "shadow-sky-500/10",
      badge: "bg-sky-400/15 text-sky-200 ring-sky-400/30",
      empty: "border-sky-400/20",
      action: "bg-sky-500 hover:bg-sky-400 text-black",
    },
  },
  {
    status: "READY",
    title: "Ready",
    hint: "Handoff / serve",
    icon: CheckCircle2,
    tone: {
      bar: "from-emerald-400 to-teal-500",
      glow: "shadow-emerald-500/10",
      badge: "bg-emerald-400/15 text-emerald-200 ring-emerald-400/30",
      empty: "border-emerald-400/20",
      action: "bg-emerald-500 hover:bg-emerald-400 text-black",
    },
  },
];

const TYPE_META: Record<
  OrderType,
  { label: string; icon: typeof Store; className: string }
> = {
  DINE_IN: {
    label: "Dine-in",
    icon: UtensilsCrossed,
    className: "bg-violet-500/15 text-violet-200 ring-violet-400/25",
  },
  TAKEAWAY: {
    label: "Takeaway",
    icon: ShoppingBag,
    className: "bg-cyan-500/15 text-cyan-200 ring-cyan-400/25",
  },
  DELIVERY: {
    label: "Delivery",
    icon: Bike,
    className: "bg-rose-500/15 text-rose-200 ring-rose-400/25",
  },
};

function waitMinutes(placedAt: Date | string | null, createdAt: Date | string) {
  const start = new Date(placedAt ?? createdAt).getTime();
  return Math.max(0, Math.floor((Date.now() - start) / 60000));
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function ticketCode(orderNumber: string) {
  return orderNumber.replace(/^ORD-\d+-/, "#");
}

function addressLine(order: KitchenOrder) {
  const c = order.customer;
  if (!c) return null;
  return [
    c.addressLine1,
    c.addressLine2,
    [c.city, c.state, c.postalCode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}

function urgencyClass(mins: number) {
  if (mins >= 15) {
    return {
      timer: "bg-rose-500 text-white shadow-lg shadow-rose-500/30 animate-pulse",
      card: "ring-1 ring-rose-400/40 bg-gradient-to-br from-rose-500/10 to-transparent",
    };
  }
  if (mins >= 8) {
    return {
      timer: "bg-amber-400 text-black shadow-lg shadow-amber-400/25",
      card: "ring-1 ring-amber-400/30 bg-gradient-to-br from-amber-500/10 to-transparent",
    };
  }
  return {
    timer: "bg-white/10 text-white/80 ring-1 ring-white/10",
    card: "ring-1 ring-white/10 bg-white/[0.03]",
  };
}

function TicketCard({
  order,
  actionClass,
  pending,
  onAdvance,
  onCancel,
}: {
  order: KitchenOrder;
  actionClass: string;
  pending: boolean;
  onAdvance: () => void;
  onCancel: () => void;
}) {
  const mins = waitMinutes(order.placedAt, order.createdAt);
  const urgency = urgencyClass(mins);
  const type = TYPE_META[order.orderType];
  const TypeIcon = type.icon;
  const next =
    order.status === "PENDING"
      ? ("CONFIRMED" as const)
      : order.status === "CONFIRMED"
        ? ("READY" as const)
        : ("FULFILLED" as const);
  const nextLabel =
    next === "FULFILLED"
      ? completeActionLabel(order.orderType)
      : next === "CONFIRMED"
        ? "Start preparing"
        : "Mark ready";
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  const deliveryAddress = addressLine(order);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30",
        urgency.card,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-black tracking-tight text-white">
                {ticketCode(order.orderNumber)}
              </h3>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                  type.className,
                )}
              >
                <TypeIcon className="h-3 w-3" />
                {type.label}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50">
              {order.table ? (
                <span className="font-medium text-white/75">
                  Table {order.table.code}
                </span>
              ) : null}
              {order.orderType === "DINE_IN" ? (
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {order.guestCount}
                </span>
              ) : null}
              <span>
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </span>
              <span className="tabular-nums">
                {formatMoney(order.totalCents, order.currency)}
              </span>
            </div>
          </div>

          <div
            className={cn(
              "flex shrink-0 flex-col items-center rounded-xl px-2.5 py-1.5",
              urgency.timer,
            )}
          >
            <Timer className="mb-0.5 h-3.5 w-3.5 opacity-80" />
            <span className="text-sm font-black tabular-nums leading-none">
              {mins}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-80">
              min
            </span>
          </div>
        </div>

        {order.customer ? (
          <div className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3 py-2">
            <p className="truncate text-sm font-medium text-white/90">
              {order.customer.name}
              {order.customer.phone ? (
                <span className="font-normal text-white/45">
                  {" "}
                  · {order.customer.phone}
                </span>
              ) : null}
            </p>
            {order.orderType === "DELIVERY" && deliveryAddress ? (
              <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-white/45">
                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-rose-300" />
                <span>{deliveryAddress}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <ul className="mt-3 space-y-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-xl bg-black/25 p-2 ring-1 ring-white/5"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/10">
                {item.product.imageUrl ? (
                  <Image
                    src={item.product.imageUrl}
                    alt={item.productName}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-white/25">
                    <UtensilsCrossed className="h-4 w-4" />
                  </div>
                )}
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e11d48] px-1 text-[10px] font-black text-white shadow-md">
                  {item.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {item.productName}
                </p>
                <p className="truncate text-[11px] text-white/40">
                  {item.productSku}
                </p>
              </div>
            </li>
          ))}
        </ul>

        {order.notes ? (
          <div className="mt-3 rounded-xl border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs leading-5 text-amber-100">
            <span className="font-bold uppercase tracking-wide text-amber-200">
              Note
            </span>
            <p className="mt-0.5">{order.notes}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-2 border-t border-white/8 bg-black/25 p-3">
        <button
          type="button"
          disabled={pending}
          onClick={onAdvance}
          className={cn(
            "inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-bold transition disabled:opacity-50",
            actionClass,
          )}
        >
          {next === "FULFILLED" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : next === "CONFIRMED" ? (
            <ChefHat className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {nextLabel}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white/55 ring-1 ring-white/10 transition hover:bg-rose-500/20 hover:text-rose-200 disabled:opacity-50"
          aria-label="Cancel order"
          title="Cancel"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

export function KitchenBoard({
  organizationName,
  orders,
}: {
  organizationName: string;
  orders: KitchenOrder[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => new Date());
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

  useEffect(() => {
    const tick = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      router.refresh();
      setLastRefresh(new Date());
    }, 8000);
    return () => window.clearInterval(id);
  }, [router]);

  const stats = useMemo(() => {
    const overdue = orders.filter(
      (o) => waitMinutes(o.placedAt, o.createdAt) >= 8,
    ).length;
    const avgWait =
      orders.length === 0
        ? 0
        : Math.round(
            orders.reduce(
              (sum, o) => sum + waitMinutes(o.placedAt, o.createdAt),
              0,
            ) / orders.length,
          );
    return {
      total: orders.length,
      overdue,
      avgWait,
      byStatus: {
        PENDING: orders.filter((o) => o.status === "PENDING").length,
        CONFIRMED: orders.filter((o) => o.status === "CONFIRMED").length,
        READY: orders.filter((o) => o.status === "READY").length,
      },
    };
  }, [orders, now]);

  function advance(
    orderId: string,
    toStatus: "CONFIRMED" | "READY" | "FULFILLED" | "CANCELLED",
  ) {
    startTransition(async () => {
      const result = await kitchenAdvanceOrderAction(orderId, toStatus);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(result.success);
      setLastRefresh(new Date());
      router.refresh();
    });
  }

  function refreshNow() {
    startTransition(() => {
      router.refresh();
      setLastRefresh(new Date());
    });
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-[#070b14] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden
      >
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute right-0 top-20 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 border-b border-white/8 bg-[#0b1220]/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#fb7185] to-[#e11d48] shadow-lg shadow-rose-500/30">
              <ChefHat className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight">Kitchen Display</p>
              <p className="text-xs text-white/45">{organizationName}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 sm:flex">
              <Clock3 className="h-3.5 w-3.5 text-white/40" />
              <span className="font-mono text-xs tabular-nums text-white/80">
                {formatClock(now)}
              </span>
            </div>
            <div className="hidden items-center gap-2 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10 md:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] text-white/50">
                Live · synced {formatClock(lastRefresh)}
              </span>
            </div>
            <button
              type="button"
              onClick={refreshNow}
              disabled={pending}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/5 px-3 text-xs font-semibold text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", pending && "animate-spin")}
              />
              Refresh
            </button>
            <Link
              href="/pos"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#e11d48] to-[#be123c] px-3 text-xs font-bold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110"
            >
              <Store className="h-3.5 w-3.5" />
              Open POS
            </Link>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Open tickets
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Avg wait
            </p>
            <p className="mt-0.5 text-xl font-black tabular-nums">
              {stats.avgWait}
              <span className="ml-1 text-xs font-semibold text-white/40">min</span>
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Needs attention
            </p>
            <p
              className={cn(
                "mt-0.5 text-xl font-black tabular-nums",
                stats.overdue > 0 ? "text-rose-300" : "text-white",
              )}
            >
              {stats.overdue}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/8">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Pipeline
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
              <span className="text-amber-300">{stats.byStatus.PENDING}</span>
              <span className="text-white/25">→</span>
              <span className="text-sky-300">{stats.byStatus.CONFIRMED}</span>
              <span className="text-white/25">→</span>
              <span className="text-emerald-300">{stats.byStatus.READY}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnOrders = orders.filter((o) => o.status === column.status);
          const Icon = column.icon;
          return (
            <section
              key={column.status}
              className={cn(
                "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#0d1424]/90 shadow-2xl backdrop-blur-sm",
                column.tone.glow,
              )}
            >
              <div className="relative border-b border-white/8 px-4 py-3.5">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1 bg-gradient-to-r",
                    column.tone.bar,
                  )}
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl ring-1",
                        column.tone.badge,
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-bold tracking-tight">
                        {column.title}
                      </p>
                      <p className="text-[11px] text-white/40">{column.hint}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-black ring-1",
                      column.tone.badge,
                    )}
                  >
                    {columnOrders.length}
                  </span>
                </div>
              </div>

              <div className="scroll-dark min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
                {columnOrders.length === 0 ? (
                  <div
                    className={cn(
                      "flex h-full min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed px-4 text-center",
                      column.tone.empty,
                    )}
                  >
                    <Icon className="mb-3 h-8 w-8 text-white/20" />
                    <p className="text-sm font-medium text-white/40">
                      No tickets
                    </p>
                    <p className="mt-1 text-xs text-white/25">
                      Orders will appear here live
                    </p>
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <TicketCard
                      key={order.id}
                      order={order}
                      actionClass={column.tone.action}
                      pending={pending}
                      onAdvance={() =>
                        advance(
                          order.id,
                          order.status === "PENDING"
                            ? "CONFIRMED"
                            : order.status === "CONFIRMED"
                              ? "READY"
                              : "FULFILLED",
                        )
                      }
                      onCancel={() => advance(order.id, "CANCELLED")}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
