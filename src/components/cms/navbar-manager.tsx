"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { saveCmsNavbarAction } from "@/lib/actions/cms";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NavRow = {
  id?: string;
  label: string;
  href: string;
  visible: boolean;
  openInNewTab: boolean;
  pageId?: string | null;
};

export function NavbarManager({
  initialItems,
  pages,
}: {
  initialItems: NavRow[];
  pages: { id: string; title: string; slug: string }[];
}) {
  const [items, setItems] = useState<NavRow[]>(
    initialItems.length
      ? initialItems
      : [{ label: "Home", href: "/", visible: true, openInNewTab: false }],
  );
  const [state, action, pending] = useActionState(saveCmsNavbarAction, {} as ActionState);

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  function update(index: number, patch: Partial<NavRow>) {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="itemsJson" value={JSON.stringify(items)} />

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id ?? `new-${index}`}
            className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <Input
              label="Label"
              value={item.label}
              onChange={(e) => update(index, { label: e.target.value })}
            />
            <Input
              label="Href"
              value={item.href}
              onChange={(e) => update(index, { href: e.target.value })}
              placeholder="/about-us"
            />
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 pb-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={item.visible}
                  onChange={(e) => update(index, { visible: e.target.checked })}
                />
                Visible
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setItems((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="sm:col-span-3">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Link to CMS page (optional)</span>
                <select
                  className="h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm"
                  value={item.pageId ?? ""}
                  onChange={(e) => {
                    const pageId = e.target.value || null;
                    const page = pages.find((p) => p.id === pageId);
                    update(index, {
                      pageId,
                      href: page
                        ? page.slug === "home"
                          ? "/"
                          : `/${page.slug}`
                        : item.href,
                    });
                  }}
                >
                  <option value="">Custom href</option>
                  {pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (/{p.slug === "home" ? "" : p.slug})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              {
                label: "New link",
                href: "/",
                visible: true,
                openInNewTab: false,
              },
            ])
          }
        >
          <Plus className="h-4 w-4" />
          Add link
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save navbar"}
        </Button>
      </div>
    </form>
  );
}
