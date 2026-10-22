import { RegisterForm } from "@/components/auth/auth-form";
import { registerAction } from "@/lib/actions/auth";

export const metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold tracking-tight">Create workspace</h1>
      <p className="mt-1 text-sm text-muted">
        Spin up a tenant and start managing orders in minutes.
      </p>
      <div className="mt-6">
        <RegisterForm action={registerAction} />
      </div>
    </div>
  );
}
