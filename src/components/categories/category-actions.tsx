"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "@/lib/actions/categories";

export function CategoryActions({ categoryId }: { categoryId: string }) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Delete this category?")) return;
    try {
      await deleteCategoryAction(categoryId);
      toast.success("Category deleted");
      router.push("/categories");
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
