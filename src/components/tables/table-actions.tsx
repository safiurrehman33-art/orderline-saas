"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  deleteTableAction,
  setTableStatusAction,
} from "@/lib/actions/tables";
import type { TableStatus } from "@/generated/prisma/client";

const QUICK: TableStatus[] = ["AVAILABLE", "OCCUPIED", "RESERVED", "CLEANING"];

export function TableActions({
  tableId,
  canDelete,
}: {
  tableId: string;
  canDelete?: boolean;
}) {
  const router = useRouter();

  async function setStatus(status: TableStatus) {
    try {
      await setTableStatusAction(tableId, status);
      toast.success(`Marked ${status.toLowerCase()}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    }
  }

  async function onDelete() {
    if (!confirm("Delete this table?")) return;
    try {
      await deleteTableAction(tableId);
      toast.success("Table deleted");
      router.push("/tables");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK.map((status) => (
        <Button
          key={status}
          size="sm"
          variant="secondary"
          onClick={() => setStatus(status)}
        >
          {status}
        </Button>
      ))}
      {canDelete ? (
        <Button size="sm" variant="danger" onClick={onDelete}>
          Delete
        </Button>
      ) : null}
    </div>
  );
}
