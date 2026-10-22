"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { productSchema } from "@/lib/validations/product";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import { parseMoneyToCents } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/uploads";
import { Prisma } from "@/generated/prisma/client";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseProductForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    description: String(formData.get("description") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    imageUrl: String(formData.get("imageUrl") ?? ""),
    price: String(formData.get("price") ?? ""),
    cost: String(formData.get("cost") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
    stockQty: String(formData.get("stockQty") ?? "0"),
    trackStock: formData.get("trackStock") === "on",
    active: formData.get("active") === "on" || formData.get("active") === "true",
    sortOrder: String(formData.get("sortOrder") ?? "0"),
  };
}

export async function createProductAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("products:write");
  const raw = parseProductForm(formData);
  if (!formData.has("active")) raw.active = true;

  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const priceCents = parseMoneyToCents(parsed.data.price);
  if (priceCents === null || priceCents < 0) {
    return { error: "Enter a valid price." };
  }
  const costCents = parsed.data.cost ? parseMoneyToCents(parsed.data.cost) : null;
  if (parsed.data.cost && costCents === null) {
    return { error: "Enter a valid cost." };
  }

  const categoryId = emptyToNull(parsed.data.categoryId);
  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, organizationId: tenant.organizationId },
    });
    if (!category) return { error: "Category not found." };
  }

  let imageUrl = emptyToNull(parsed.data.imageUrl);
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "products");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }

  let product;
  try {
    product = await db.product.create({
      data: {
        organizationId: tenant.organizationId,
        name: parsed.data.name.trim(),
        sku: parsed.data.sku.trim().toUpperCase(),
        description: emptyToNull(parsed.data.description),
        categoryId,
        imageUrl,
        priceCents,
        costCents,
        currency: parsed.data.currency.toUpperCase(),
        stockQty: parsed.data.stockQty,
        trackStock: parsed.data.trackStock,
        active: formData.get("active") !== "off",
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A product with this SKU already exists." };
    }
    throw error;
  }

  await auditFromTenant(tenant, {
    action: "product.created",
    entityType: "product",
    entityId: product.id,
    summary: `Created product ${product.name} (${product.sku})`,
  });

  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  return { success: "Product created." };
}

export async function updateProductAction(
  productId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("products:write");
  const existing = await db.product.findFirst({
    where: { id: productId, organizationId: tenant.organizationId },
  });
  if (!existing) return { error: "Product not found." };

  const raw = parseProductForm(formData);
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const priceCents = parseMoneyToCents(parsed.data.price);
  if (priceCents === null || priceCents < 0) {
    return { error: "Enter a valid price." };
  }
  const costCents = parsed.data.cost ? parseMoneyToCents(parsed.data.cost) : null;

  const categoryId = emptyToNull(parsed.data.categoryId);
  if (categoryId) {
    const category = await db.category.findFirst({
      where: { id: categoryId, organizationId: tenant.organizationId },
    });
    if (!category) return { error: "Category not found." };
  }

  let imageUrl = emptyToNull(parsed.data.imageUrl) ?? existing.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "products");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }
  if (formData.get("clearImage") === "on") {
    imageUrl = null;
  }

  try {
    await db.product.update({
      where: { id: productId },
      data: {
        name: parsed.data.name.trim(),
        sku: parsed.data.sku.trim().toUpperCase(),
        description: emptyToNull(parsed.data.description),
        categoryId,
        imageUrl,
        priceCents,
        costCents,
        currency: parsed.data.currency.toUpperCase(),
        stockQty: parsed.data.stockQty,
        trackStock: parsed.data.trackStock,
        active: formData.get("active") === "on" || formData.get("active") === "true",
        sortOrder: parsed.data.sortOrder,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { error: "A product with this SKU already exists." };
    }
    throw error;
  }

  await auditFromTenant(tenant, {
    action: "product.updated",
    entityType: "product",
    entityId: productId,
    summary: `Updated product ${parsed.data.name.trim()}`,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/pos");
  revalidatePath("/activity");
  return { success: "Product updated." };
}

export async function toggleProductActiveAction(productId: string) {
  const tenant = await requirePermission("products:write");
  const existing = await db.product.findFirst({
    where: { id: productId, organizationId: tenant.organizationId },
  });
  if (!existing) throw new Error("Product not found.");

  await db.product.update({
    where: { id: productId },
    data: { active: !existing.active },
  });

  await auditFromTenant(tenant, {
    action: existing.active ? "product.deactivated" : "product.activated",
    entityType: "product",
    entityId: productId,
    summary: `${existing.active ? "Deactivated" : "Activated"} product ${existing.name}`,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/pos");
  revalidatePath("/activity");
}

export async function archiveProductAction(productId: string) {
  const tenant = await requirePermission("products:delete");
  const existing = await db.product.findFirst({
    where: { id: productId, organizationId: tenant.organizationId },
  });
  if (!existing) throw new Error("Product not found.");

  const archivedAt = existing.archivedAt ? null : new Date();
  await db.product.update({
    where: { id: productId },
    data: {
      archivedAt,
      active: existing.archivedAt ? existing.active : false,
    },
  });

  await auditFromTenant(tenant, {
    action: archivedAt ? "product.archived" : "product.restored",
    entityType: "product",
    entityId: productId,
    summary: `${archivedAt ? "Archived" : "Restored"} product ${existing.name}`,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
  revalidatePath("/pos");
  revalidatePath("/activity");
}

export async function deleteProductAction(productId: string) {
  const tenant = await requirePermission("products:delete");
  const existing = await db.product.findFirst({
    where: { id: productId, organizationId: tenant.organizationId },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!existing) throw new Error("Product not found.");
  if (existing._count.orderItems > 0) {
    throw new Error("Cannot delete a product used on orders. Archive instead.");
  }

  await db.product.delete({ where: { id: productId } });
  await auditFromTenant(tenant, {
    action: "product.deleted",
    entityType: "product",
    entityId: productId,
    summary: `Deleted product ${existing.name} (${existing.sku})`,
  });
  revalidatePath("/products");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function listProducts(params: {
  q?: string;
  status?: "active" | "inactive" | "archived" | "all";
  categoryId?: string;
  page?: number;
  pageSize?: number;
  sort?: "name" | "sku" | "priceCents" | "createdAt" | "stockQty";
  dir?: "asc" | "desc";
}) {
  const tenant = await requirePermission("products:read");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 10));
  const sort = params.sort ?? "createdAt";
  const dir = params.dir ?? "desc";
  const status = params.status ?? "active";

  const where: Prisma.ProductWhereInput = {
    organizationId: tenant.organizationId,
  };

  if (status === "active") {
    where.active = true;
    where.archivedAt = null;
  } else if (status === "inactive") {
    where.active = false;
    where.archivedAt = null;
  } else if (status === "archived") {
    where.archivedAt = { not: null };
  }

  if (params.categoryId?.trim()) {
    where.categoryId = params.categoryId.trim();
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [total, items, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { orderItems: true } },
        category: { select: { id: true, name: true, color: true } },
      },
    }),
    db.category.findMany({
      where: { organizationId: tenant.organizationId, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    categories,
  };
}
