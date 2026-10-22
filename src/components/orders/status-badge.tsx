import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/generated/prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";

const toneMap: Record<
  OrderStatus,
  "neutral" | "warning" | "info" | "success" | "danger"
> = {
  DRAFT: "neutral",
  PENDING: "warning",
  CONFIRMED: "info",
  READY: "success",
  FULFILLED: "success",
  CANCELLED: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={toneMap[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
