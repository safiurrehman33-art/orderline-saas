"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileText,
  LockKeyhole,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FEATURES = [
  {
    icon: FileText,
    title: "CMS pages",
    text: "Create unlimited marketing pages with a rich editor.",
  },
  {
    icon: Search,
    title: "SEO controls",
    text: "Meta titles, descriptions, OG images, and canonical paths.",
  },
  {
    icon: Navigation,
    title: "Navbar manager",
    text: "Control every public header link from one panel.",
  },
];

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        toast.error("Invalid credentials.");
        return;
      }
      router.replace("/super-admin");
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#f5f9f6] text-[#10241a]">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Brand panel — AdminCN / Aurora style split login */}
        <aside className="relative hidden overflow-hidden bg-[#10241a] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(13,159,110,0.35),transparent_42%),radial-gradient(circle_at_85%_80%,rgba(110,231,176,0.12),transparent_40%)]" />
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d9f6e] text-sm font-bold shadow-[0_12px_30px_-12px_rgba(13,159,110,1)]">
                OL
              </span>
              <span className="text-lg font-semibold tracking-tight">
                OrderLine
              </span>
            </Link>
            <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6ee7b0]">
              <Sparkles className="h-3.5 w-3.5" />
              Platform control
            </p>
            <h1 className="mt-5 max-w-md font-[family-name:var(--font-sora)] text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              Manage the marketing site from one premium console.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/65">
              Pages, SEO, and navbar — built for Super Admins who need clear
              control over the public OrderLine experience.
            </p>
          </div>

          <div className="relative space-y-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d9f6e]/20 text-[#6ee7b0]">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-sm text-white/60">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Form panel */}
        <main className="relative flex items-center justify-center px-6 py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(13,159,110,0.1),transparent_35%)]" />
          <div className="relative w-full max-w-[420px]">
            <div className="mb-8 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0d9f6e] text-sm font-bold text-white">
                  OL
                </span>
                <span className="text-base font-semibold">OrderLine</span>
              </Link>
            </div>

            <div className="rounded-[1.75rem] border border-[#d7e5dc] bg-white p-7 shadow-[0_40px_90px_-50px_rgba(16,36,26,0.45)] sm:p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f7f0] text-[#0d9f6e]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <h2 className="mt-4 font-[family-name:var(--font-sora)] text-2xl font-semibold tracking-tight">
                Super Admin sign in
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#5f7a6c]">
                Enter your platform credentials to manage pages, SEO, and the
                public navbar.
              </p>

              <form onSubmit={onSubmit} className="mt-7 space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="admin@orderline.app"
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
                <Button
                  type="submit"
                  disabled={pending}
                  className="h-11 w-full rounded-xl bg-[#0d9f6e] text-sm font-semibold hover:bg-[#0b865c]"
                >
                  {pending ? "Signing in…" : "Sign in to console"}
                </Button>
              </form>

              <div className="mt-6 flex items-start gap-2 rounded-xl border border-[#d7e5dc] bg-[#f7fbf8] px-3 py-3 text-xs leading-5 text-[#5f7a6c]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0d9f6e]" />
                Access is limited to users with Super Admin privileges.
              </div>
            </div>

            <p className="mt-6 text-center text-sm text-[#5f7a6c]">
              <Link href="/" className="font-medium text-[#0d9f6e] hover:underline">
                ← Back to marketing site
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
