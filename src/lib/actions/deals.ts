"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { dealSchema } from "@/lib/validations/deal";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import { parseMoneyToCents, slugify } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/uploads";
import { Prisma } from "@/generated/prisma/client";

type DealLine = { productId: string; quantity: number };

async function uniqueDealSlug(organizationId: string, name: string) {
  const base = slugify(name) || "deal";
  let slug = base;
  let n = 1;
  while (
    await db.deal.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

function parseItems(raw: string): DealLine[] | null {
  try {
    const parsed = JSON.parse(raw) as DealLine[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const cleaned = parsed
      .filter((i) => i.productId && Number(i.quantity) > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: Math.max(1, Math.floor(Number(i.quantity))),
      }));
    return cleaned.length ? cleaned : null;
  } catch {
    return null;
  }
}

async function syncDealProduct(
  organizationId: string,
  deal: {
    name: string;
    slug: string;
    description: string | null;
    imageUrl: string | null;
    priceCents: number;
    sortOrder: number;
    active: boolean;
  },
) {
  const dealsCategory = await db.category.findFirst({
    where: { organizationId, slug: "deals" },
  });

  let categoryId = dealsCategory?.id;
  if (!categoryId) {
    const created = await db.category.create({
      data: {
        organizationId,
        name: "Deals",
        slug: "deals",
        color: "#be123c",
        sortOrder: 0,
        active: true,
        description: "Value combos",
      },
    });
    categoryId = created.id;
  }

  const sku = `DEAL-${deal.slug.toUpperCase()}`;
  await db.product.upsert({
    where: {
      organizationId_sku: { organizationId, sku },
    },
    update: {
      name: deal.name,
      description: deal.description,
      imageUrl: deal.imageUrl,
      priceCents: deal.priceCents,
      categoryId,
      sortOrder: deal.sortOrder,
      active: deal.active,
      archivedAt: deal.active ? null : new Date(),
    },
    create: {
      organizationId,
      name: deal.name,
      sku,
      description: deal.description,
      imageUrl: deal.imageUrl,
      priceCents: deal.priceCents,
      categoryId,
      sortOrder: deal.sortOrder,
      active: deal.active,
      trackStock: false,
      currency: "USD",
    },
  });
}

export async function listDeals() {
  const tenant = await requirePermission("products:read");
  return db.deal.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true, priceCents: true } },
        },
      },
    },
  });
}

export async function createDealAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("products:write");
  const parsed = dealSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    compareAt: String(formData.get("compareAt") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    active: formData.get("active") !== "off",
    itemsJson: String(formData.get("itemsJson") ?? "[]"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid deal.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const items = parseItems(parsed.data.itemsJson);
  if (!items) return { error: "Add at least one included product." };

  const priceCents = parseMoneyToCents(parsed.data.price);
  if (priceCents === null || priceCents < 0) {
    return { error: "Enter a valid deal price." };
  }
  const compareAtCents = parsed.data.compareAt
    ? parseMoneyToCents(parsed.data.compareAt)
    : null;

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: productIds },
      archivedAt: null,
      NOT: { sku: { startsWith: "DEAL-" } },
    },
  });
  if (products.length !== new Set(productIds).size) {
    return { error: "One or more products are invalid." };
  }

  let imageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "products");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }

  const slug = await uniqueDealSlug(tenant.organizationId, parsed.data.name);
  const active = formData.get("active") !== "off";

  try {
    const deal = await db.$transaction(async (tx) => {
      const created = await tx.deal.create({
        data: {
          organizationId: tenant.organizationId,
          name: parsed.data.name.trim(),
          slug,
          description: parsed.data.description?.trim() || null,
          imageUrl,
          priceCents,
          compareAtCents,
          sortOrder: parsed.data.sortOrder,
          active,
          items: {
            create: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
            })),
          },
        },
      });
      return created;
    });

    await syncDealProduct(tenant.organizationId, {
      name: deal.name,
      slug: deal.slug,
      description: deal.description,
      imageUrl: deal.imageUrl,
      priceCents: deal.priceCents,
      sortOrder: deal.sortOrder,
      active: deal.active,
    });

    await auditFromTenant(tenant, {
      action: "deal.created",
      entityType: "deal",
      entityId: deal.id,
      summary: `Created deal ${deal.name}`,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A deal with this name already exists." };
    }
    throw error;
  }

  revalidatePath("/deals");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Deal created." };
}

export async function updateDealAction(
  dealId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("products:write");
  const existing = await db.deal.findFirst({
    where: { id: dealId, organizationId: tenant.organizationId },
  });
  if (!existing) return { error: "Deal not found." };

  const parsed = dealSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    compareAt: String(formData.get("compareAt") ?? ""),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
    itemsJson: String(formData.get("itemsJson") ?? "[]"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid deal.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const items = parseItems(parsed.data.itemsJson);
  if (!items) return { error: "Add at least one included product." };

  const priceCents = parseMoneyToCents(parsed.data.price);
  if (priceCents === null || priceCents < 0) {
    return { error: "Enter a valid deal price." };
  }
  const compareAtCents = parsed.data.compareAt
    ? parseMoneyToCents(parsed.data.compareAt)
    : null;

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: {
      organizationId: tenant.organizationId,
      id: { in: productIds },
      archivedAt: null,
      NOT: { sku: { startsWith: "DEAL-" } },
    },
  });
  if (products.length !== new Set(productIds).size) {
    return { error: "One or more products are invalid." };
  }

  let imageUrl = existing.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "products");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }
  if (formData.get("clearImage") === "on") imageUrl = null;

  const active =
    formData.get("active") === "on" || formData.get("active") === "true";

  await db.$transaction(async (tx) => {
    await tx.dealItem.deleteMany({ where: { dealId } });
    await tx.deal.update({
      where: { id: dealId },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        imageUrl,
        priceCents,
        compareAtCents,
        sortOrder: parsed.data.sortOrder,
        active,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        },
      },
    });
  });

  await syncDealProduct(tenant.organizationId, {
    name: parsed.data.name.trim(),
    slug: existing.slug,
    description: parsed.data.description?.trim() || null,
    imageUrl,
    priceCents,
    sortOrder: parsed.data.sortOrder,
    active,
  });

  await auditFromTenant(tenant, {
    action: "deal.updated",
    entityType: "deal",
    entityId: dealId,
    summary: `Updated deal ${parsed.data.name.trim()}`,
  });

  revalidatePath("/deals");
  revalidatePath(`/deals/${dealId}`);
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Deal updated." };
}

export async function deleteDealAction(dealId: string) {
  const tenant = await requirePermission("products:delete");
  const existing = await db.deal.findFirst({
    where: { id: dealId, organizationId: tenant.organizationId },
  });
  if (!existing) throw new Error("Deal not found.");

  await db.deal.delete({ where: { id: dealId } });
  await db.product.updateMany({
    where: {
      organizationId: tenant.organizationId,
      sku: `DEAL-${existing.slug.toUpperCase()}`,
    },
    data: { active: false, archivedAt: new Date() },
  });

  await auditFromTenant(tenant, {
    action: "deal.deleted",
    entityType: "deal",
    entityId: dealId,
    summary: `Deleted deal ${existing.name}`,
  });

  revalidatePath("/deals");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/activity");
}
