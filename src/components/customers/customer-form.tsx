"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customers";
import type { ActionState } from "@/lib/actions/auth";

export type CustomerFormValues = {
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  notes?: string | null;
  tags?: string[];
};

type Props = {
  mode: "create" | "edit";
  customer?: CustomerFormValues & { id: string };
};

export function CustomerForm({ mode, customer }: Props) {
  const router = useRouter();
  const action =
    mode === "create"
      ? createCustomerAction
      : updateCustomerAction.bind(null, customer!.id);

  const [state, formAction, pending] = useActionState(action, {} as ActionState);

  useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      if (mode === "create") {
        router.push("/customers");
      } else {
        router.refresh();
      }
    }
    if (state.error) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  const tagsValue =
    customer?.tags && customer.tags.length > 0
      ? customer.tags.join(", ")
      : "";

  return (
    <form
      action={formAction}
      className="rounded-xl border border-line bg-surface p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          placeholder="Jane Customer"
          required
          defaultValue={customer?.name ?? ""}
          error={state.fieldErrors?.name?.[0]}
          className="sm:col-span-2"
        />
        <Input
          name="email"
          type="email"
          label="Email"
          placeholder="jane@company.com"
          defaultValue={customer?.email ?? ""}
          error={state.fieldErrors?.email?.[0]}
        />
        <Input
          name="phone"
          label="Phone"
          placeholder="+1 555 0100"
          defaultValue={customer?.phone ?? ""}
          error={state.fieldErrors?.phone?.[0]}
        />
        <Input
          name="company"
          label="Company"
          placeholder="Acme Inc."
          defaultValue={customer?.company ?? ""}
          error={state.fieldErrors?.company?.[0]}
          className="sm:col-span-2"
        />
        <Input
          name="addressLine1"
          label="Address line 1"
          defaultValue={customer?.addressLine1 ?? ""}
          error={state.fieldErrors?.addressLine1?.[0]}
          className="sm:col-span-2"
        />
        <Input
          name="addressLine2"
          label="Address line 2"
          defaultValue={customer?.addressLine2 ?? ""}
          error={state.fieldErrors?.addressLine2?.[0]}
          className="sm:col-span-2"
        />
        <Input
          name="city"
          label="City"
          defaultValue={customer?.city ?? ""}
          error={state.fieldErrors?.city?.[0]}
        />
        <Input
          name="state"
          label="State / region"
          defaultValue={customer?.state ?? ""}
          error={state.fieldErrors?.state?.[0]}
        />
        <Input
          name="postalCode"
          label="Postal code"
          defaultValue={customer?.postalCode ?? ""}
          error={state.fieldErrors?.postalCode?.[0]}
        />
        <Input
          name="country"
          label="Country"
          defaultValue={customer?.country ?? "US"}
          error={state.fieldErrors?.country?.[0]}
        />
        <Input
          name="tags"
          label="Tags"
          hint="Comma-separated"
          placeholder="vip, wholesale"
          defaultValue={tagsValue}
          error={state.fieldErrors?.tags?.[0]}
          className="sm:col-span-2"
        />
        <Textarea
          name="notes"
          label="Notes"
          defaultValue={customer?.notes ?? ""}
          error={state.fieldErrors?.notes?.[0]}
          className="sm:col-span-2"
        />
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create customer"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
