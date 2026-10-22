"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";
import { requirePermission, requireTenant } from "@/lib/tenant";
import type { ActionState } from "@/lib/actions/auth";
import { auditFromTenant } from "@/lib/audit";
import { saveUploadedImage } from "@/lib/uploads";
import { z } from "zod";
import type { MembershipRole } from "@/generated/prisma/client";

const orgSchema = z.object({
  name: z.string().min(2).max(80),
});

const pricingSchema = z.object({
  taxEnabled: z.boolean(),
  salesTaxPercent: z.coerce.number().min(0).max(100),
  vatPercent: z.coerce.number().min(0).max(100),
  serviceChargePercent: z.coerce.number().min(0).max(100),
  pricesIncludeTax: z.boolean(),
});

const inviteSchema = z.object({
  email: z.email(),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export async function updateOrganizationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("org:update");
  const parsed = orgSchema.safeParse({
    name: String(formData.get("name") ?? ""),
  });
  if (!parsed.success) {
    return { error: "Organization name is required." };
  }

  const clearLogo = formData.get("clearLogo") === "on";
  const logoFile = formData.get("logo");
  let logoUrl: string | null | undefined;
  if (clearLogo) {
    logoUrl = null;
  } else if (logoFile instanceof File && logoFile.size > 0) {
    try {
      logoUrl = await saveUploadedImage(
        logoFile,
        tenant.organizationId,
        "branding",
      );
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Logo upload failed.",
      };
    }
  }

  await db.organization.update({
    where: { id: tenant.organizationId },
    data: {
      name: parsed.data.name.trim(),
      ...(logoUrl !== undefined ? { logoUrl } : {}),
    },
  });

  await auditFromTenant(tenant, {
    action: "org.updated",
    entityType: "organization",
    entityId: tenant.organizationId,
    summary: `Updated organization ${parsed.data.name.trim()}`,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/activity");
  revalidatePath("/pos");
  return {
    success:
      "Organization updated. Re-login or switch org to refresh session name.",
  };
}

export async function updateSmartPricingAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("pricing:write");
  const parsed = pricingSchema.safeParse({
    taxEnabled: formData.get("taxEnabled") === "on",
    salesTaxPercent: String(formData.get("salesTaxPercent") ?? "0"),
    vatPercent: String(formData.get("vatPercent") ?? "0"),
    serviceChargePercent: String(formData.get("serviceChargePercent") ?? "0"),
    pricesIncludeTax: formData.get("pricesIncludeTax") === "on",
  });

  if (!parsed.success) {
    return { error: "Enter valid tax percentages (0–100)." };
  }

  await db.organization.update({
    where: { id: tenant.organizationId },
    data: parsed.data,
  });

  await auditFromTenant(tenant, {
    action: "pricing.updated",
    entityType: "organization",
    entityId: tenant.organizationId,
    summary: parsed.data.taxEnabled
      ? `Smart Pricing on · sales ${parsed.data.salesTaxPercent}% · VAT ${parsed.data.vatPercent}% · service ${parsed.data.serviceChargePercent}%`
      : "Smart Pricing disabled",
  });

  revalidatePath("/settings");
  revalidatePath("/pricing");
  revalidatePath("/pos");
  revalidatePath("/orders");
  revalidatePath("/activity");
  return { success: "Smart Pricing saved." };
}

export async function inviteMemberAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requirePermission("members:manage");
  const parsed = inviteSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? "MEMBER"),
  });
  if (!parsed.success) {
    return { error: "Enter a valid email and role." };
  }

  const email = parsed.data.email.toLowerCase();
  const role = parsed.data.role as MembershipRole;

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingMembership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: existingUser.id,
          organizationId: tenant.organizationId,
        },
      },
    });
    if (existingMembership) {
      return { error: "User is already a member." };
    }

    await db.membership.create({
      data: {
        userId: existingUser.id,
        organizationId: tenant.organizationId,
        role,
      },
    });

    await auditFromTenant(tenant, {
      action: "member.added",
      entityType: "member",
      entityId: existingUser.id,
      summary: `Added member ${email} as ${role}`,
    });

    revalidatePath("/settings");
    revalidatePath("/activity");
    return { success: "Member added to the organization." };
  }

  // Create placeholder invite + provisional user with temp password for demo
  const tempPassword = `Tmp-${Math.random().toString(36).slice(2, 10)}!`;
  const passwordHash = await hash(tempPassword, 12);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: email.split("@")[0],
        passwordHash,
      },
    });
    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: tenant.organizationId,
        role,
      },
    });
    await tx.organizationInvite.create({
      data: {
        email,
        role,
        organizationId: tenant.organizationId,
        invitedById: tenant.userId,
        expiresAt,
      },
    });
  });

  await auditFromTenant(tenant, {
    action: "member.invited",
    entityType: "member",
    entityId: email,
    summary: `Invited ${email} as ${role}`,
  });

  revalidatePath("/settings");
  revalidatePath("/activity");
  return {
    success: `Invite created. Temporary password for ${email}: ${tempPassword}`,
  };
}

export async function updateMemberRoleAction(
  membershipId: string,
  role: MembershipRole,
) {
  const tenant = await requirePermission("members:manage");
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: tenant.organizationId },
    include: { user: { select: { email: true } } },
  });
  if (!membership) throw new Error("Membership not found.");
  if (membership.role === "OWNER") {
    throw new Error("Owner role cannot be changed.");
  }
  if (role === "OWNER") {
    throw new Error("Use ownership transfer to assign OWNER.");
  }

  await db.membership.update({
    where: { id: membershipId },
    data: { role },
  });

  await auditFromTenant(tenant, {
    action: "member.role_changed",
    entityType: "member",
    entityId: membership.userId,
    summary: `${membership.user.email}: ${membership.role} → ${role}`,
  });

  revalidatePath("/settings");
  revalidatePath("/activity");
}

export async function removeMemberAction(membershipId: string) {
  const tenant = await requirePermission("members:manage");
  const membership = await db.membership.findFirst({
    where: { id: membershipId, organizationId: tenant.organizationId },
    include: { user: { select: { email: true } } },
  });
  if (!membership) throw new Error("Membership not found.");
  if (membership.role === "OWNER") {
    throw new Error("Cannot remove the owner.");
  }
  if (membership.userId === tenant.userId) {
    throw new Error("You cannot remove yourself.");
  }

  await db.membership.delete({ where: { id: membershipId } });
  await auditFromTenant(tenant, {
    action: "member.removed",
    entityType: "member",
    entityId: membership.userId,
    summary: `Removed member ${membership.user.email}`,
  });
  revalidatePath("/settings");
  revalidatePath("/activity");
}

export async function getOrganizationSettings() {
  const tenant = await requireTenant();
  const [organization, members, invites] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: tenant.organizationId },
    }),
    db.membership.findMany({
      where: { organizationId: tenant.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.organizationInvite.findMany({
      where: {
        organizationId: tenant.organizationId,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { tenant, organization, members, invites };
}
