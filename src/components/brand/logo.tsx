import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-9", className)}
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="currentColor" className="text-accent" />
      <ellipse cx="20" cy="23" rx="11" ry="7" fill="white" fillOpacity="0.95" />
      <ellipse
        cx="20"
        cy="23"
        rx="7.5"
        ry="4.5"
        fill="currentColor"
        className="text-accent"
        fillOpacity="0.18"
      />
      <path
        d="M12.5 9.5v6.2c0 1.2.7 2.2 1.7 2.6V28h1.6V18.3c1-.4 1.7-1.4 1.7-2.6V9.5h-1.3v5.5h-1.1V9.5h-1.3v5.5h-1.1V9.5H12.5z"
        fill="white"
      />
      <path
        d="M25.2 9.2c2.4 3.2 3.4 6.4 3.1 9.2-.2 1.8-1.2 2.8-2.6 3.1V28h-1.7V21.4c-1.3-.5-2-1.7-1.8-3.4.3-2.8 1.5-6 2.9-9z"
        fill="white"
      />
    </svg>
  );
}

export function BrandLogo({
  className,
  subtitle,
  logoUrl,
}: {
  className?: string;
  subtitle?: string;
  logoUrl?: string | null;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {logoUrl ? (
        <span className="relative h-9 w-9 overflow-hidden rounded-[10px] border border-line bg-white">
          <Image
            src={logoUrl}
            alt=""
            fill
            className="object-contain p-0.5"
            sizes="36px"
          />
        </span>
      ) : (
        <BrandMark />
      )}
      <span className="min-w-0">
        <span className="block text-sm font-semibold tracking-tight text-foreground">
          OrderLine
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        ) : null}
      </span>
    </span>
  );
}
