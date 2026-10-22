"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  archiveProductAction,
  deleteProductAction,
  toggleProductActiveAction,
} from "@/lib/actions/products";

export function ProductActions({
  productId,
  active,
  archived,
  canDelete,
}: {
  productId: string;
  active: boolean;
  archived: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();

  async function handleToggleActive() {
    try {
      await toggleProductActiveAction(productId);
      toast.success(active ? "Product deactivated." : "Product activated.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Action failed.",
      );
    }
  }

  async function handleArchive() {
    const label = archived ? "restore" : "archive";
    if (!confirm(`Are you sure you want to ${label} this product?`)) return;
    try {
      await archiveProductAction(productId);
      toast.success(
        archived ? "Product restored." : "Product archived.",
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
        "Permanently delete this product? This cannot be undone.",
      )
    ) {
      return;
    }
    try {
      await deleteProductAction(productId);
      toast.success("Product deleted.");
      router.push("/products");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Delete failed.",
      );
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!archived ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleToggleActive}
        >
          <Power className="h-4 w-4" />
          {active ? "Deactivate" : "Activate"}
        </Button>
      ) : null}
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
