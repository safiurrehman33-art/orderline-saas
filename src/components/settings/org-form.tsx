"use client";

import { useActionState, useEffect } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";

export function OrgForm({
  action,
  defaultName,
  logoUrl,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaultName: string;
  logoUrl?: string | null;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} encType="multipart/form-data" className="space-y-4">
      <Input name="name" label="Name" defaultValue={defaultName} required />

      <div className="space-y-2">
        <p className="text-sm font-medium">Company logo</p>
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-line bg-background">
              <Image
                src={logoUrl}
                alt="Company logo"
                fill
                className="object-contain p-1"
                sizes="56px"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="clearLogo" value="on" />
              Remove current logo
            </label>
          </div>
        ) : null}
        <Input name="logo" type="file" accept="image/*" label="Upload logo" />
        <p className="text-xs text-muted">JPG, PNG, WEBP or GIF · max 4MB</p>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
