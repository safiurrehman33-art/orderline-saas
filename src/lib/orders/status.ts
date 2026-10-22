import type { OrderStatus, OrderType } from "@/generated/prisma/client";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PENDING: "New",
  CONFIRMED: "Preparing",
  READY: "Ready",
  FULFILLED: "Completed",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ["PENDING", "CANCELLED"],
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["READY", "CANCELLED"],
  READY: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: ["DRAFT"],
};

/** Button labels for kitchen / cashier actions */
export const ORDER_STATUS_ACTION_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Save draft",
  PENDING: "Send to kitchen",
  CONFIRMED: "Start preparing",
  READY: "Mark ready",
  FULFILLED: "Complete order",
  CANCELLED: "Cancel",
};

export function completeActionLabel(orderType: OrderType): string {
  if (orderType === "DELIVERY") return "Mark delivered";
  if (orderType === "TAKEAWAY") return "Mark picked up";
  return "Mark completed";
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

export function isOrderLocked(status: OrderStatus) {
  return status === "FULFILLED" || status === "CANCELLED";
}

export const KITCHEN_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "READY",
];
