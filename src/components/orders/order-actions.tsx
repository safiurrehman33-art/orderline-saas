"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import type { OrderStatus } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import {
  deleteOrderAction,
  duplicateOrderAction,
  transitionOrderStatusAction,
} from "@/lib/actions/orders";
import {
  ORDER_STATUS_ACTION_LABELS,
  ORDER_STATUS_TRANSITIONS,
  completeActionLabel,
} from "@/lib/orders/status";
import type { ActionState } from "@/lib/actions/auth";
import type { OrderType } from "@/generated/prisma/client";

function StatusTransitionForm({
  orderId,
  toStatus,
  orderType,
}: {
  orderId: string;
  toStatus: OrderStatus;
  orderType?: OrderType;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    transitionOrderStatusAction.bind(null, orderId),
    {} as ActionState,
  );

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.refresh();
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const label =
    toStatus === "FULFILLED" && orderType
      ? completeActionLabel(orderType)
      : ORDER_STATUS_ACTION_LABELS[toStatus];

  return (
    <form action={formAction}>
      <input type="hidden" name="status" value={toStatus} />
      <Button
        type="submit"
        variant={toStatus === "CANCELLED" ? "danger" : "secondary"}
        size="sm"
        disabled={pending}
      >
        {label}
      </Button>
    </form>
  );
}

export function OrderActions({
  orderId,
  status,
  orderType,
  canDelete,
  canDuplicate,
}: {
  orderId: string;
  status: OrderStatus;
  orderType?: OrderType;
  canDelete: boolean;
  canDuplicate: boolean;
}) {
  const router = useRouter();
  const transitions = ORDER_STATUS_TRANSITIONS[status];

  async function handleDuplicate() {
    try {
      const newId = await duplicateOrderAction(orderId);
      toast.success("Order duplicated as draft.");
      router.push(`/orders/${newId}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Duplicate failed.",
      );
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Permanently delete this order? Stock adjustments will be reversed.",
      )
    ) {
      return;
    }
    try {
      await deleteOrderAction(orderId);
      toast.success("Order deleted.");
      router.push("/orders");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed.",
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {transitions.map((toStatus) => (
        <StatusTransitionForm
          key={toStatus}
          orderId={orderId}
          toStatus={toStatus}
          orderType={orderType}
        />
      ))}
      {canDuplicate ? (
        <Button type="button" variant="outline" size="sm" onClick={handleDuplicate}>
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
      ) : null}
      {canDelete ? (
        <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}
