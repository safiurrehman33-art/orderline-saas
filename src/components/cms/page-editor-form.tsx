"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { upsertCmsPageAction } from "@/lib/actions/cms";
import type { ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { RichTextEditor } from "@/components/cms/rich-text-editor";
import { HomeBlocksEditor } from "@/components/cms/home-blocks-editor";
import {
  DEFAULT_HOME_BLOCKS,
  type HomeBlocks,
} from "@/lib/cms/types";

type PageModel = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentHtml: string;
  homeBlocks: unknown;
  template: "DEFAULT" | "HOME";
  status: "DRAFT" | "PUBLISHED";
  isSystem: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  canonicalPath: string | null;
  noIndex: boolean;
};

export function PageEditorForm({ page }: { page?: PageModel | null }) {
  const [state, action, pending] = useActionState(upsertCmsPageAction, {} as ActionState);
  const isHome = page?.template === "HOME" || page?.slug === "home";
  const [homeBlocks, setHomeBlocks] = useState<HomeBlocks>(
    () => (page?.homeBlocks as HomeBlocks | null) ?? DEFAULT_HOME_BLOCKS,
  );

  useEffect(() => {
    if (state.success) toast.success(state.success);
    if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="space-y-6">
      {page?.id ? <input type="hidden" name="id" value={page.id} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="title"
          label="Title"
          defaultValue={page?.title ?? ""}
          required
        />
        <Input
          name="slug"
          label="URL slug"
          defaultValue={page?.slug ?? ""}
          disabled={page?.isSystem}
          placeholder="about-us"
        />
        {page?.isSystem ? (
          <input type="hidden" name="slug" value={page.slug} />
        ) : null}
      </div>

      <Textarea
        name="excerpt"
        label="Short excerpt"
        defaultValue={page?.excerpt ?? ""}
        className="min-h-20"
      />

      <Select
        name="status"
        label="Status"
        defaultValue={page?.status ?? "DRAFT"}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "PUBLISHED", label: "Published" },
        ]}
      />

      {isHome ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Home page editor</p>
          <p className="text-xs text-muted">
            Control hero, feature stories with photos, showcase, and CTA. Published
            changes appear on the public marketing home.
          </p>
          <input
            type="hidden"
            name="homeBlocksJson"
            value={JSON.stringify(homeBlocks)}
          />
          <HomeBlocksEditor value={homeBlocks} onChange={setHomeBlocks} />
        </div>
      ) : (
        <RichTextEditor
          name="contentHtml"
          defaultValue={page?.contentHtml ?? ""}
          label="Page editor"
        />
      )}

      <div className="rounded-2xl border border-line bg-background/50 p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">SEO controls</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="metaTitle"
            label="Meta title"
            defaultValue={page?.metaTitle ?? ""}
          />
          <Input
            name="metaKeywords"
            label="Meta keywords"
            defaultValue={page?.metaKeywords ?? ""}
          />
          <div className="sm:col-span-2">
            <Textarea
              name="metaDescription"
              label="Meta description"
              defaultValue={page?.metaDescription ?? ""}
              className="min-h-20"
            />
          </div>
          <Input
            name="ogImage"
            label="OG image URL"
            defaultValue={page?.ogImage ?? ""}
            placeholder="/menu/menu-bucket.jpg"
          />
          <Input
            name="canonicalPath"
            label="Canonical path"
            defaultValue={page?.canonicalPath ?? ""}
            placeholder="/about-us"
          />
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            name="noIndex"
            value="on"
            defaultChecked={page?.noIndex}
          />
          noindex (hide from search engines)
        </label>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save page"}
      </Button>
    </form>
  );
}
