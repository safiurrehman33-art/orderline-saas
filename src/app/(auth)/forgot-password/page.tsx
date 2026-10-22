import { ForgotPasswordForm } from "@/components/auth/password-forms";
import { forgotPasswordAction } from "@/lib/actions/auth";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-8 shadow-sm shadow-black/5">
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <p className="mt-1 text-sm text-muted">
        No email provider is configured. We&apos;ll generate a one-hour secure
        reset link you can copy.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm action={forgotPasswordAction} />
      </div>
    </div>
  );
}
