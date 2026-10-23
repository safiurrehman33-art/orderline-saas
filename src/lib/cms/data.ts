import { db } from "@/lib/db";
import {
  DEFAULT_HOME_BLOCKS,
  DEFAULT_OWNER_MODULES,
  type HomeBlocks,
} from "@/lib/cms/types";

export async function getPublishedNavItems() {
  return db.cmsNavItem.findMany({
    where: { visible: true },
    orderBy: { sortOrder: "asc" },
    include: { page: { select: { slug: true, status: true } } },
  });
}

export async function getPublishedPageBySlug(slug: string) {
  return db.cmsPage.findFirst({
    where: { slug, status: "PUBLISHED" },
  });
}

function normalizeHomeBlocks(raw: HomeBlocks | null | undefined): HomeBlocks {
  const base = raw ?? DEFAULT_HOME_BLOCKS;
  return {
    ...DEFAULT_HOME_BLOCKS,
    ...base,
    hero: { ...DEFAULT_HOME_BLOCKS.hero, ...base.hero },
    features: base.features?.length ? base.features : DEFAULT_HOME_BLOCKS.features,
    showcase: { ...DEFAULT_HOME_BLOCKS.showcase, ...base.showcase },
    bottomCta: { ...DEFAULT_HOME_BLOCKS.bottomCta, ...base.bottomCta },
    modulesHeading: base.modulesHeading ?? DEFAULT_HOME_BLOCKS.modulesHeading,
    modulesSubheading:
      base.modulesSubheading ?? DEFAULT_HOME_BLOCKS.modulesSubheading,
    // Keep module copy editable later, but always use the latest product images.
    modules: DEFAULT_OWNER_MODULES,
  };
}

export async function getHomePage() {
  const page = await db.cmsPage.findFirst({
    where: { slug: "home", status: "PUBLISHED" },
  });
  const blocks = normalizeHomeBlocks(page?.homeBlocks as HomeBlocks | null);
  return { page, blocks };
}

export async function listCmsPagesForAdmin() {
  return db.cmsPage.findMany({
    orderBy: [{ isSystem: "desc" }, { title: "asc" }],
  });
}

export async function getCmsPageById(id: string) {
  return db.cmsPage.findUnique({ where: { id } });
}

export async function listCmsNavForAdmin() {
  return db.cmsNavItem.findMany({
    orderBy: { sortOrder: "asc" },
    include: { page: { select: { id: true, title: true, slug: true } } },
  });
}

export function slugifyCms(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
