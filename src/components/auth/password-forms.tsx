"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";

export function ForgotPasswordForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="email"
        type="email"
        label="Account email"
        placeholder="you@company.com"
        required
        autoComplete="email"
        error={state.fieldErrors?.email?.[0]}
      />
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div className="space-y-2 rounded-lg bg-accent-soft px-3 py-3 text-sm text-foreground">
          <p>{state.success}</p>
          {state.resetUrl ? (
            <p className="break-all font-mono text-xs text-accent">{state.resetUrl}</p>
          ) : null}
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Generating..." : "Generate reset link"}
      </Button>
      <p className="text-center text-sm text-muted">
        <Link href="/login" className="font-medium text-accent hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({
  action,
  token,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  token: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Input
        name="password"
        type="password"
        label="New password"
        placeholder="At least 8 characters"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <div className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
          <p>{state.success}</p>
          <Link href="/login" className="mt-2 inline-block font-medium text-accent hover:underline">
            Sign in
          </Link>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Updating..." : "Update password"}
        </Button>
      )}
    </form>
  );
}

export function ChangePasswordForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="currentPassword"
        type="password"
        label="Current password"
        required
        autoComplete="current-password"
        error={state.fieldErrors?.currentPassword?.[0]}
      />
      <Input
        name="password"
        type="password"
        label="New password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.password?.[0]}
      />
      <Input
        name="confirmPassword"
        type="password"
        label="Confirm new password"
        required
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
      />
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm text-foreground">
          {state.success}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Updating..." : "Change password"}
      </Button>
    </form>
  );
}
