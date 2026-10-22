"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export function SiteMobileNav({
  items,
}: {
  items: { id: string; label: string; href: string; openInNewTab: boolean }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative lg:hidden">
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#d7e5dc] bg-white text-[#3d5649] shadow-sm"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>
      {open ? (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-[#d7e5dc] bg-white p-2 shadow-xl shadow-[#10241a]/10">
          <nav className="flex flex-col">
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noreferrer" : undefined}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#3d5649] hover:bg-[#eef5f1] hover:text-[#10241a]"
              >
                {item.label}
              </Link>
            ))}
            <a
              href="/#modules"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#3d5649] hover:bg-[#eef5f1] hover:text-[#10241a]"
            >
              Modules
            </a>
            <a
              href="/#insights"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#3d5649] hover:bg-[#eef5f1] hover:text-[#10241a]"
            >
              Insights
            </a>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
