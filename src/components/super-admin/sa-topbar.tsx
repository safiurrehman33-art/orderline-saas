"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { ExternalLink, LogOut, ShieldCheck } from "lucide-react";

export function SaTopbar({
  email,
  title,
  subtitle,
}: {
  email?: string | null;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#e7eee9] bg-white/85 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="min-w-0 pl-12 lg:pl-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="hidden h-4 w-4 text-[#0d9f6e] sm:block" />
            <h1 className="truncate text-lg font-semibold tracking-tight text-[#10241a]">
              {title}
            </h1>
          </div>
          {subtitle ? (
            <p className="mt-0.5 truncate text-sm text-[#5f7a6c]">{subtitle}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {email ? (
            <div className="hidden rounded-full border border-[#d7e5dc] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#3d5649] sm:block">
              {email}
            </div>
          ) : null}
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e5dc] bg-white px-3.5 py-2 text-sm font-medium text-[#3d5649] transition hover:bg-[#eef5f1] hover:text-[#10241a]"
          >
            View site
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#10241a] px-3.5 py-2 text-sm font-medium text-white transition hover:bg-[#1a3428]"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
