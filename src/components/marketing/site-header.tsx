import Link from "next/link";
import { auth } from "@/auth";
import { SiteMobileNav } from "@/components/marketing/site-mobile-nav";

export async function SiteHeader({
  items,
}: {
  items: { id: string; label: string; href: string; openInNewTab: boolean }[];
}) {
  const session = await auth();

  const cta =
    session?.user?.isSuperAdmin && !session.user.organizationId ? (
      <Link
        href="/super-admin"
        className="rounded-full bg-[#0d9f6e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b865c]"
      >
        Super Admin
      </Link>
    ) : session?.user?.organizationId ? (
      <Link
        href="/dashboard"
        className="rounded-full bg-[#0d9f6e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b865c]"
      >
        Open app
      </Link>
    ) : (
      <>
        <Link
          href="/login"
          className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-[#3d5649] transition hover:bg-[#eef5f1] hover:text-[#10241a] sm:inline"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-full bg-[#0d9f6e] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b865c]"
        >
          Start free
        </Link>
      </>
    );

  return (
    <header className="sticky top-0 z-50 border-b border-[#e2ebe6]/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-[1.15rem] font-semibold tracking-tight text-[#10241a]"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#0d9f6e] text-sm font-bold text-white shadow-[0_8px_20px_-10px_rgba(13,159,110,0.9)]">
            OL
          </span>
          OrderLine
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.openInNewTab ? "_blank" : undefined}
              rel={item.openInNewTab ? "noreferrer" : undefined}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[#4b6558] transition hover:bg-[#eef5f1] hover:text-[#10241a]"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="/#modules"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[#4b6558] transition hover:bg-[#eef5f1] hover:text-[#10241a]"
          >
            Modules
          </a>
          <a
            href="/#insights"
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[#4b6558] transition hover:bg-[#eef5f1] hover:text-[#10241a]"
          >
            Insights
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {cta}
          <SiteMobileNav items={items} />
        </div>
      </div>
    </header>
  );
}
