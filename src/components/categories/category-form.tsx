"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCategoryAction,
  updateCategoryAction,
} from "@/lib/actions/categories";
import type { ActionState } from "@/lib/actions/auth";

export function CategoryForm({
  mode,
  category,
}: {
  mode: "create" | "edit";
  category?: {
    id: string;
    name: string;
    description?: string | null;
    color: string;
    sortOrder: number;
    active: boolean;
    imageUrl?: string | null;
  };
}) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createCategoryAction
      : updateCategoryAction.bind(null, category!.id);
  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") router.push("/categories");
      else router.refresh();
    }
    if (state.error) toast.error(state.error);
  }, [state, mode, router]);

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
    >
      <Input
        name="name"
        label="Name"
        required
        defaultValue={category?.name ?? ""}
        error={state.fieldErrors?.name?.[0]}
      />
      <Textarea
        name="description"
        label="Description"
        defaultValue={category?.description ?? ""}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name="color"
          type="color"
          label="Color"
          defaultValue={category?.color ?? "#0f6b4c"}
          className="h-12 p-1"
        />
        <Input
          name="sortOrder"
          type="number"
          label="Sort order"
          defaultValue={String(category?.sortOrder ?? 0)}
        />
        <Input name="image" type="file" label="Image" accept="image/*" />
      </div>
      {category?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={category.imageUrl}
          alt=""
          className="h-24 w-24 rounded-lg object-cover"
        />
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="active" value="off" />
        <input
          type="checkbox"
          name="active"
          value="on"
          defaultChecked={category?.active ?? true}
        />
        Active
      </label>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Create category" : "Save"}
      </Button>
    </form>
  );
}
