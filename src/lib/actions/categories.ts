"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import { categorySchema } from "@/lib/validations/category";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import { slugify } from "@/lib/utils";
import { saveUploadedImage } from "@/lib/uploads";
import { Prisma } from "@/generated/prisma/client";

async function uniqueCategorySlug(organizationId: string, name: string) {
  const base = slugify(name) || "category";
  let slug = base;
  let n = 1;
  while (
    await db.category.findUnique({
      where: { organizationId_slug: { organizationId, slug } },
    })
  ) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function listCategories(includeInactive = true) {
  const tenant = await requirePermission("categories:read");
  return db.category.findMany({
    where: {
      organizationId: tenant.organizationId,
      ...(includeInactive ? {} : { active: true }),
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
}

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("categories:write");
  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    color: String(formData.get("color") ?? "#0f6b4c"),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let imageUrl: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "categories");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }

  const slug = await uniqueCategorySlug(tenant.organizationId, parsed.data.name);
  const category = await db.category.create({
    data: {
      organizationId: tenant.organizationId,
      name: parsed.data.name.trim(),
      slug,
      description: parsed.data.description?.trim() || null,
      color: parsed.data.color || "#0f6b4c",
      sortOrder: parsed.data.sortOrder,
      active: formData.get("active") !== "off",
      imageUrl,
    },
  });

  await auditFromTenant(tenant, {
    action: "category.created",
    entityType: "category",
    entityId: category.id,
    summary: `Created category ${category.name}`,
  });

  revalidatePath("/categories");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Category created." };
}

export async function updateCategoryAction(
  categoryId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("categories:write");
  const existing = await db.category.findFirst({
    where: { id: categoryId, organizationId: tenant.organizationId },
  });
  if (!existing) return { error: "Category not found." };

  const parsed = categorySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    color: String(formData.get("color") ?? existing.color),
    sortOrder: String(formData.get("sortOrder") ?? "0"),
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let imageUrl = existing.imageUrl;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = await saveUploadedImage(file, tenant.organizationId, "categories");
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Upload failed" };
    }
  }

  await db.category.update({
    where: { id: categoryId },
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      color: parsed.data.color || existing.color,
      sortOrder: parsed.data.sortOrder,
      active: formData.get("active") === "on" || formData.get("active") === "true",
      imageUrl,
    },
  });

  await auditFromTenant(tenant, {
    action: "category.updated",
    entityType: "category",
    entityId: categoryId,
    summary: `Updated category ${parsed.data.name.trim()}`,
  });

  revalidatePath("/categories");
  revalidatePath("/pos");
  revalidatePath("/products");
  revalidatePath("/activity");
  return { success: "Category updated." };
}

export async function deleteCategoryAction(categoryId: string) {
  const tenant = await requirePermission("categories:delete");
  const existing = await db.category.findFirst({
    where: { id: categoryId, organizationId: tenant.organizationId },
    include: { _count: { select: { products: true } } },
  });
  if (!existing) throw new Error("Category not found.");
  if (existing._count.products > 0) {
    throw new Error("Move or reassign products before deleting this category.");
  }

  try {
    await db.category.delete({ where: { id: categoryId } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error("Unable to delete category.");
    }
    throw error;
  }

  await auditFromTenant(tenant, {
    action: "category.deleted",
    entityType: "category",
    entityId: categoryId,
    summary: `Deleted category ${existing.name}`,
  });

  revalidatePath("/categories");
  revalidatePath("/pos");
  revalidatePath("/activity");
}
