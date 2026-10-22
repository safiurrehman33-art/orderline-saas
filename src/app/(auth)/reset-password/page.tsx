import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { resetPasswordAction } from "@/lib/actions/auth";

export const metadata = { title: "Set new password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold tracking-tight">Set new password</h1>
      <p className="mt-1 text-sm text-muted">
        Choose a new password for your OrderLine account.
      </p>
      <div className="mt-6">
        {token ? (
          <ResetPasswordForm action={resetPasswordAction} token={token} />
        ) : (
          <div className="space-y-3 text-sm">
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
              Missing reset token. Request a new link.
            </p>
            <Link href="/forgot-password" className="font-medium text-accent hover:underline">
              Forgot password
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
