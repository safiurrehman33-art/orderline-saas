"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BadgePercent,
  ChefHat,
  FileBarChart2,
  Flame,
  LayoutDashboard,
  LayoutGrid,
  Package,
  Bot,
  Settings,
  ShoppingCart,
  Store,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  accent?: "pos";
};

type NavSection = {
  label: string;
  links: NavLink[];
};

const sections: NavSection[] = [
  {
    label: "Main",
    links: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/pos", label: "POS Terminal", icon: Store, accent: "pos" },
      { href: "/orders", label: "Orders", icon: ShoppingCart },
      { href: "/kitchen", label: "Kitchen", icon: ChefHat },
    ],
  },
  {
    label: "Menu",
    links: [
      { href: "/deals", label: "Deals", icon: Flame },
      { href: "/categories", label: "Categories", icon: Tags },
      { href: "/products", label: "Products", icon: Package },
    ],
  },
  {
    label: "Floor",
    links: [{ href: "/tables", label: "Tables", icon: LayoutGrid }],
  },
  {
    label: "Customers",
    links: [{ href: "/customers", label: "Customers", icon: Users }],
  },
  {
    label: "Insights",
    links: [{ href: "/reports", label: "Reports", icon: FileBarChart2 }],
  },
  {
    label: "Automation",
    links: [
      {
        href: "/whatsapp",
        label: "WhatsApp Chatbot",
        icon: Bot,
      },
    ],
  },
  {
    label: "System",
    links: [
      { href: "/pricing", label: "Smart Pricing", icon: BadgePercent },
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export function Sidebar({
  organizationName,
  logoUrl,
}: {
  organizationName: string;
  logoUrl?: string | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-surface/90 backdrop-blur">
      <div className="border-b border-line px-5 py-5">
        <Link href="/dashboard" className="block">
          <BrandLogo subtitle={organizationName} logoUrl={logoUrl} />
        </Link>
      </div>

      <nav className="scroll-light flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/80">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.links.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-accent-soft text-accent"
                        : "text-muted hover:bg-line/50 hover:text-foreground",
                      link.accent === "pos" &&
                        !active &&
                        "bg-[#fff1f2] text-[#be123c] hover:bg-[#ffe4e6]",
                      link.accent === "pos" &&
                        active &&
                        "bg-[#ffe4e6] text-[#be123c]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-4 text-xs text-muted">
        Restaurant POS · multi-tenant
      </div>
    </aside>
  );
}
