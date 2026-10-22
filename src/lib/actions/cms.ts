"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/cms/super-admin";
import { slugifyCms } from "@/lib/cms/data";
import {
  DEFAULT_HOME_BLOCKS,
  type HomeBlocks,
} from "@/lib/cms/types";
import type { ActionState } from "@/lib/actions/auth";

function asJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}

function revalidateMarketing(slug?: string) {
  revalidatePath("/");
  revalidatePath("/super-admin");
  revalidatePath("/super-admin/pages");
  revalidatePath("/super-admin/navbar");
  if (slug && slug !== "home") {
    revalidatePath(`/${slug}`);
    revalidatePath(`/p/${slug}`);
  }
}

export async function upsertCmsPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  let slug = String(formData.get("slug") ?? "").trim();
  const excerpt = String(formData.get("excerpt") ?? "").trim() || null;
  const contentHtml = String(formData.get("contentHtml") ?? "");
  const status = String(formData.get("status") ?? "DRAFT") === "PUBLISHED"
    ? "PUBLISHED"
    : "DRAFT";
  const metaTitle = String(formData.get("metaTitle") ?? "").trim() || null;
  const metaDescription =
    String(formData.get("metaDescription") ?? "").trim() || null;
  const metaKeywords = String(formData.get("metaKeywords") ?? "").trim() || null;
  const ogImage = String(formData.get("ogImage") ?? "").trim() || null;
  const canonicalPath =
    String(formData.get("canonicalPath") ?? "").trim() || null;
  const noIndex = formData.get("noIndex") === "on";
  const homeBlocksRaw = String(formData.get("homeBlocksJson") ?? "").trim();

  if (!title) return { error: "Title is required." };

  const existing = id
    ? await db.cmsPage.findUnique({ where: { id } })
    : null;

  if (existing?.isSystem) {
    slug = existing.slug;
  } else {
    slug = slugifyCms(slug || title);
  }
  if (!slug) return { error: "Slug is required." };

  const taken = await db.cmsPage.findFirst({
    where: {
      slug,
      ...(id ? { NOT: { id } } : {}),
    },
  });
  if (taken) return { error: "That slug is already used by another page." };

  let homeBlocks: Prisma.InputJsonValue | undefined;
  const template = existing?.template ?? (slug === "home" ? "HOME" : "DEFAULT");
  if (template === "HOME") {
    try {
      const parsed = homeBlocksRaw
        ? (JSON.parse(homeBlocksRaw) as HomeBlocks)
        : DEFAULT_HOME_BLOCKS;
      homeBlocks = asJson(parsed);
    } catch {
      return { error: "Home page JSON is invalid." };
    }
  }

  const data = {
    title,
    slug,
    excerpt,
    contentHtml,
    status: status as "DRAFT" | "PUBLISHED",
    metaTitle,
    metaDescription,
    metaKeywords,
    ogImage,
    canonicalPath,
    noIndex,
    publishedAt: status === "PUBLISHED" ? new Date() : null,
    ...(homeBlocks !== undefined ? { homeBlocks } : {}),
  };

  if (existing) {
    await db.cmsPage.update({ where: { id: existing.id }, data });
  } else {
    await db.cmsPage.create({
      data: {
        ...data,
        template: slug === "home" ? "HOME" : "DEFAULT",
        isSystem: false,
        homeBlocks: homeBlocks ?? undefined,
      },
    });
  }

  revalidateMarketing(slug);
  return { success: status === "PUBLISHED" ? "Page published." : "Page saved." };
}

export async function deleteCmsPageAction(id: string): Promise<ActionState> {
  await requireSuperAdmin();
  const page = await db.cmsPage.findUnique({ where: { id } });
  if (!page) return { error: "Page not found." };
  if (page.isSystem) return { error: "System pages cannot be deleted." };

  await db.cmsPage.delete({ where: { id } });
  revalidateMarketing(page.slug);
  return { success: "Page deleted." };
}

export async function saveCmsNavbarAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSuperAdmin();
  const raw = String(formData.get("itemsJson") ?? "[]");
  let items: Array<{
    id?: string;
    label: string;
    href: string;
    visible: boolean;
    openInNewTab: boolean;
    pageId?: string | null;
  }>;
  try {
    items = JSON.parse(raw) as typeof items;
  } catch {
    return { error: "Invalid navbar payload." };
  }

  const existing = await db.cmsNavItem.findMany({ select: { id: true } });
  const keepIds = new Set(
    items.map((i) => i.id).filter(Boolean) as string[],
  );

  await db.$transaction(async (tx) => {
    for (const row of existing) {
      if (!keepIds.has(row.id)) {
        await tx.cmsNavItem.delete({ where: { id: row.id } });
      }
    }
    for (let i = 0; i < items.length; i += 1) {
      const item = items[i];
      const label = item.label?.trim();
      const href = item.href?.trim();
      if (!label || !href) continue;
      const data = {
        label,
        href,
        visible: Boolean(item.visible),
        openInNewTab: Boolean(item.openInNewTab),
        sortOrder: i,
        pageId: item.pageId || null,
      };
      if (item.id && keepIds.has(item.id)) {
        await tx.cmsNavItem.update({ where: { id: item.id }, data });
      } else {
        await tx.cmsNavItem.create({ data });
      }
    }
  });

  revalidateMarketing();
  return { success: "Navbar saved." };
}
