import { LoginForm } from "@/components/auth/auth-form";
import { loginAction } from "@/lib/actions/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">
        Sign in to your OrderLine workspace.
      </p>
      <div className="mt-6">
        <LoginForm action={loginAction} callbackUrl={params.callbackUrl} />
      </div>
    </div>
  );
}
