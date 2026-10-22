"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  Menu,
  Navigation,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/super-admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/super-admin/pages", label: "Pages", icon: FileText },
  { href: "/super-admin/pages/new", label: "New page", icon: PlusCircle },
  { href: "/super-admin/navbar", label: "Navbar", icon: Navigation },
];

export function SaSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    if (href === "/super-admin/pages") {
      return (
        pathname === "/super-admin/pages" ||
        (pathname.startsWith("/super-admin/pages/") &&
          !pathname.startsWith("/super-admin/pages/new"))
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            title={item.label}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-[#0d9f6e] text-white shadow-[0_10px_24px_-14px_rgba(13,159,110,0.9)]"
                : "text-[#4b6558] hover:bg-[#eef5f1] hover:text-[#10241a]",
              collapsed && "justify-center px-2",
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span>{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d7e5dc] bg-white text-[#3d5649] shadow-sm lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-[#10241a]/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r border-[#dfeae4] bg-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[84px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center gap-3 border-b border-[#e7eee9] px-4",
            collapsed && "justify-center px-2",
          )}
        >
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0d9f6e] text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(13,159,110,0.95)]">
            OL
          </span>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#10241a]">
                OrderLine
              </p>
              <p className="truncate text-[11px] font-medium text-[#0d9f6e]">
                Super Admin
              </p>
            </div>
          ) : null}
        </div>

        {nav}

        <div className="hidden border-t border-[#e7eee9] p-3 lg:block">
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              "flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#5f7a6c] transition hover:bg-[#eef5f1] hover:text-[#10241a]",
              collapsed && "justify-center px-2",
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                Collapse
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
