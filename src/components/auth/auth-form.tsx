"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/actions/auth";

export function LoginForm({
  action,
  callbackUrl,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  callbackUrl?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl || "/dashboard"} />
      <Input
        name="email"
        type="email"
        label="Work email"
        placeholder="you@company.com"
        required
        autoComplete="email"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs font-medium text-accent hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted">
        New to OrderLine?{" "}
        <Link href="/register" className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({
  action,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="space-y-4">
      <Input
        name="name"
        label="Your name"
        placeholder="Alex Morgan"
        required
        error={state.fieldErrors?.name?.[0]}
      />
      <Input
        name="email"
        type="email"
        label="Work email"
        placeholder="you@company.com"
        required
        error={state.fieldErrors?.email?.[0]}
      />
      <Input
        name="organizationName"
        label="Organization"
        placeholder="Acme Commerce"
        required
        error={state.fieldErrors?.organizationName?.[0]}
      />
      <Input
        name="password"
        type="password"
        label="Password"
        placeholder="At least 8 characters"
        required
        error={state.fieldErrors?.password?.[0]}
      />
      {state.error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating workspace..." : "Create workspace"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
