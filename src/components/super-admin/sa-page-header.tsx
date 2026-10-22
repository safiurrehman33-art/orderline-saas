import Link from "next/link";
import { cn } from "@/lib/utils";

export function SaPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0d9f6e]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-1 font-[family-name:var(--font-sora)] text-2xl font-semibold tracking-tight text-[#10241a] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f7a6c]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SaPrimaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d9f6e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_rgba(13,159,110,0.95)] transition hover:bg-[#0b865c]",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function SaSecondaryLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border border-[#d7e5dc] bg-white px-4 py-2.5 text-sm font-semibold text-[#3d5649] transition hover:bg-[#eef5f1] hover:text-[#10241a]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
