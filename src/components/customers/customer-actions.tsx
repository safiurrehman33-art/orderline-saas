"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  archiveCustomerAction,
  deleteCustomerAction,
} from "@/lib/actions/customers";

export function CustomerActions({
  customerId,
  archived,
  canDelete,
}: {
  customerId: string;
  archived: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  async function handleArchive() {
    const label = archived ? "restore" : "archive";
    if (!confirm(`Are you sure you want to ${label} this customer?`)) return;
    try {
      await archiveCustomerAction(customerId);
      toast.success(
        archived ? "Customer restored." : "Customer archived.",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed.",
      );
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Permanently delete this customer? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await deleteCustomerAction(customerId);
      toast.success("Customer deleted.");
      router.push("/customers");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed.",
      );
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={handleArchive}
      >
        {archived ? (
          <>
            <ArchiveRestore className="h-4 w-4" />
            Restore
          </>
        ) : (
          <>
            <Archive className="h-4 w-4" />
            Archive
          </>
        )}
      </Button>
      {canDelete ? (
        <Button
          type="button"
          variant="danger"
          size="sm"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      ) : null}
    </div>
  );
}
