"use client";

import { useActionState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";
import { toast } from "sonner";

export function InviteForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Email"
        placeholder="teammate@company.com"
        required
      />
      <Select
        name="role"
        label="Role"
        defaultValue="MEMBER"
        options={[
          { label: "Member", value: "MEMBER" },
          { label: "Admin", value: "ADMIN" },
        ]}
      />
      <Button type="submit" disabled={pending}>
        {pending ? "Inviting..." : "Invite member"}
      </Button>
    </form>
  );
}
