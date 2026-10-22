"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { deleteCmsPageAction } from "@/lib/actions/cms";

export function DeletePageButton({ id }: { id: string }) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("Delete this page?")) return;
        start(async () => {
          const result = await deleteCmsPageAction(id);
          if (result.error) toast.error(result.error);
          if (result.success) toast.success(result.success);
        });
      }}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "…" : "Delete"}
    </button>
  );
}
