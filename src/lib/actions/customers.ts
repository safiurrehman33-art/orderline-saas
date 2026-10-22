"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import {
  customerSchema,
  parseTags,
} from "@/lib/validations/customer";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import { Prisma } from "@/generated/prisma/client";

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("customers:write");
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const customer = await db.customer.create({
    data: {
      organizationId: tenant.organizationId,
      name: data.name.trim(),
      email: emptyToNull(data.email),
      phone: emptyToNull(data.phone),
      company: emptyToNull(data.company),
      addressLine1: emptyToNull(data.addressLine1),
      addressLine2: emptyToNull(data.addressLine2),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      postalCode: emptyToNull(data.postalCode),
      country: emptyToNull(data.country) ?? "US",
      notes: emptyToNull(data.notes),
      tags: parseTags(data.tags),
    },
  });

  await auditFromTenant(tenant, {
    action: "customer.created",
    entityType: "customer",
    entityId: customer.id,
    summary: `Created customer ${customer.name}`,
  });

  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/pos");
  return { success: "Customer created.", customerId: customer.id };
}

export type PosCustomerCreated = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
};

export type PosCustomerActionState = ActionState & {
  customer?: PosCustomerCreated;
};

/** Create customer from POS modal; returns the new record for local selection. */
export async function createPosCustomerAction(
  _prev: PosCustomerActionState,
  formData: FormData,
): Promise<PosCustomerActionState> {
  const tenant = await requirePermission("customers:write");
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const customer = await db.customer.create({
    data: {
      organizationId: tenant.organizationId,
      name: data.name.trim(),
      email: emptyToNull(data.email),
      phone: emptyToNull(data.phone),
      company: emptyToNull(data.company),
      addressLine1: emptyToNull(data.addressLine1),
      addressLine2: emptyToNull(data.addressLine2),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      postalCode: emptyToNull(data.postalCode),
      country: emptyToNull(data.country) ?? "US",
      notes: emptyToNull(data.notes),
      tags: parseTags(data.tags),
    },
  });

  await auditFromTenant(tenant, {
    action: "customer.created",
    entityType: "customer",
    entityId: customer.id,
    summary: `Created customer ${customer.name} (POS)`,
  });

  revalidatePath("/customers");
  revalidatePath("/pos");
  revalidatePath("/dashboard");
  revalidatePath("/activity");

  return {
    success: "Customer added.",
    customerId: customer.id,
    customer: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      addressLine1: customer.addressLine1,
      addressLine2: customer.addressLine2,
      city: customer.city,
      state: customer.state,
      postalCode: customer.postalCode,
    },
  };
}

export async function updateCustomerAction(
  customerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("customers:write");
  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const existing = await db.customer.findFirst({
    where: { id: customerId, organizationId: tenant.organizationId },
  });
  if (!existing) return { error: "Customer not found." };

  const data = parsed.data;
  await db.customer.update({
    where: { id: customerId },
    data: {
      name: data.name.trim(),
      email: emptyToNull(data.email),
      phone: emptyToNull(data.phone),
      company: emptyToNull(data.company),
      addressLine1: emptyToNull(data.addressLine1),
      addressLine2: emptyToNull(data.addressLine2),
      city: emptyToNull(data.city),
      state: emptyToNull(data.state),
      postalCode: emptyToNull(data.postalCode),
      country: emptyToNull(data.country) ?? "US",
      notes: emptyToNull(data.notes),
      tags: parseTags(data.tags),
    },
  });

  await auditFromTenant(tenant, {
    action: "customer.updated",
    entityType: "customer",
    entityId: customerId,
    summary: `Updated customer ${data.name.trim()}`,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/activity");
  return { success: "Customer updated." };
}

export async function archiveCustomerAction(customerId: string) {
  const tenant = await requirePermission("customers:delete");
  const existing = await db.customer.findFirst({
    where: { id: customerId, organizationId: tenant.organizationId },
  });
  if (!existing) throw new Error("Customer not found.");

  const archivedAt = existing.archivedAt ? null : new Date();
  await db.customer.update({
    where: { id: customerId },
    data: { archivedAt },
  });

  await auditFromTenant(tenant, {
    action: archivedAt ? "customer.archived" : "customer.restored",
    entityType: "customer",
    entityId: customerId,
    summary: `${archivedAt ? "Archived" : "Restored"} customer ${existing.name}`,
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/activity");
}

export async function deleteCustomerAction(customerId: string) {
  const tenant = await requirePermission("customers:delete");
  const existing = await db.customer.findFirst({
    where: { id: customerId, organizationId: tenant.organizationId },
    include: { _count: { select: { orders: true } } },
  });
  if (!existing) throw new Error("Customer not found.");
  if (existing._count.orders > 0) {
    throw new Error("Cannot delete a customer with orders. Archive instead.");
  }

  await db.customer.delete({ where: { id: customerId } });
  await auditFromTenant(tenant, {
    action: "customer.deleted",
    entityType: "customer",
    entityId: customerId,
    summary: `Deleted customer ${existing.name}`,
  });
  revalidatePath("/customers");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
}

export async function listCustomers(params: {
  q?: string;
  status?: "active" | "archived" | "all";
  page?: number;
  pageSize?: number;
  sort?: "name" | "createdAt" | "company";
  dir?: "asc" | "desc";
}) {
  const tenant = await requirePermission("customers:read");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 10));
  const sort = params.sort ?? "createdAt";
  const dir = params.dir ?? "desc";
  const status = params.status ?? "active";

  const where: Prisma.CustomerWhereInput = {
    organizationId: tenant.organizationId,
  };

  if (status === "active") where.archivedAt = null;
  if (status === "archived") where.archivedAt = { not: null };

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      orderBy: { [sort]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: { select: { orders: true } },
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
