"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteDealAction } from "@/lib/actions/deals";

export function DealActions({ dealId }: { dealId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this deal? It will be hidden from POS.")) return;
    try {
      await deleteDealAction(dealId);
      toast.success("Deal deleted");
      router.push("/deals");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    }
  }

  return (
    <Button variant="danger" size="sm" onClick={onDelete}>
      Delete
    </Button>
  );
}
