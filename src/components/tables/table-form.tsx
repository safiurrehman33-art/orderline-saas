"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createTableAction, updateTableAction } from "@/lib/actions/tables";
import type { ActionState } from "@/lib/actions/auth";
import type { TableStatus } from "@/generated/prisma/client";

const STATUS_OPTIONS = [
  { label: "Available", value: "AVAILABLE" },
  { label: "Occupied", value: "OCCUPIED" },
  { label: "Reserved", value: "RESERVED" },
  { label: "Cleaning", value: "CLEANING" },
];

export function TableForm({
  mode,
  table,
}: {
  mode: "create" | "edit";
  table?: {
    id: string;
    name: string;
    code: string;
    seats: number;
    section?: string | null;
    status: TableStatus;
    sortOrder: number;
  };
}) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createTableAction
      : updateTableAction.bind(null, table!.id);
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") router.push("/tables");
      else router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, mode, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-line bg-surface p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="name" label="Display name" required defaultValue={table?.name ?? ""} />
        <Input name="code" label="Code" required defaultValue={table?.code ?? ""} placeholder="T1" />
        <Input
          name="seats"
          type="number"
          label="Seats"
          min={1}
          required
          defaultValue={String(table?.seats ?? 4)}
        />
        <Input name="section" label="Section" defaultValue={table?.section ?? ""} placeholder="Main hall" />
        <Select
          name="status"
          label="Status"
          defaultValue={table?.status ?? "AVAILABLE"}
          options={STATUS_OPTIONS}
        />
        <Input
          name="sortOrder"
          type="number"
          label="Sort order"
          defaultValue={String(table?.sortOrder ?? 0)}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create table" : "Save"}
      </Button>
    </form>
  );
}
