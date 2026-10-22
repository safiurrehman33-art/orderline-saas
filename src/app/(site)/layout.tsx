import { Sora } from "next/font/google";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { getPublishedNavItems } from "@/lib/cms/data";

export const dynamic = "force-dynamic";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = await getPublishedNavItems();
  const items = nav.map((n) => ({
    id: n.id,
    label: n.label,
    href: n.href,
    openInNewTab: n.openInNewTab,
  }));

  return (
    <div className={`${sora.variable} min-h-full bg-[#f5f9f6] text-[#10241a]`}>
      <SiteHeader items={items} />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-[#dfeae4] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-[#10241a]"
            >
              Order<span className="text-[#0d9f6e]">Line</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-[#5f7a6c]">
              Multi-tenant restaurant OS for owners — POS, kitchen, tables,
              customers, reports, and WhatsApp AI in one connected platform.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9f6e]">
              Site
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#4b6558]">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="hover:text-[#10241a]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0d9f6e]">
              Product
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-[#4b6558]">
              <a href="/#modules" className="hover:text-[#10241a]">
                Owner modules
              </a>
              <a href="/#insights" className="hover:text-[#10241a]">
                Insights & graphs
              </a>
              <Link href="/register" className="hover:text-[#10241a]">
                Create workspace
              </Link>
              <Link href="/login" className="hover:text-[#10241a]">
                Sign in
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e7eee9] px-6 py-5 text-center text-xs text-[#7a9184]">
          © {new Date().getFullYear()} OrderLine · Restaurant operations SaaS
        </div>
      </footer>
    </div>
  );
}
