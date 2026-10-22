"use server";

import { createHash, randomBytes } from "crypto";
import { compare, hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut, auth } from "@/auth";
import { db } from "@/lib/db";
import { writeAuditLog, auditFromTenant } from "@/lib/audit";
import { requireTenant } from "@/lib/tenant";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";
import { slugify } from "@/lib/utils";

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
  resetUrl?: string;
  customerId?: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function uniqueOrgSlug(name: string) {
  const base = slugify(name) || "workspace";
  let slug = base;
  let attempt = 1;

  while (await db.organization.findUnique({ where: { slug } })) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    organizationName: String(formData.get("organizationName") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  const slug = await uniqueOrgSlug(parsed.data.organizationName);

  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name: parsed.data.name,
        passwordHash,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: parsed.data.organizationName,
        slug,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: "OWNER",
      },
    });

    return { user, organization };
  });

  await writeAuditLog({
    action: "auth.register",
    entityType: "user",
    entityId: created.user.id,
    summary: `Workspace "${created.organization.name}" created`,
    organizationId: created.organization.id,
    actorId: created.user.id,
    actorEmail: created.user.email,
    actorName: created.user.name,
    metadata: { organizationSlug: created.organization.slug },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }

  return { success: "Account created." };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return { success: "Signed in." };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function switchOrganizationAction(organizationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: session.user.id,
        organizationId,
      },
    },
    include: { organization: { select: { name: true } } },
  });

  if (!membership) {
    throw new Error("Not a member of that organization.");
  }

  await writeAuditLog({
    action: "auth.switch_org",
    entityType: "organization",
    entityId: organizationId,
    summary: `Switched to ${membership.organization.name}`,
    organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
  });

  return {
    organizationId: membership.organizationId,
    role: membership.role,
  };
}

export async function forgotPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) {
    return {
      error: "Enter a valid email.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });

  // Always succeed to avoid account enumeration, but only mint a token when user exists.
  if (!user?.passwordHash) {
    return {
      success:
        "If that email exists, a password reset link is ready below (or was already issued).",
    };
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await db.$transaction(async (tx) => {
    await tx.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });
  });

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  await writeAuditLog({
    action: "auth.password_reset_requested",
    entityType: "user",
    entityId: user.id,
    summary: "Password reset requested",
    organizationId: membership?.organizationId ?? null,
    actorId: user.id,
    actorEmail: user.email,
    actorName: user.name,
  });

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

  return {
    success:
      "Reset link generated. Email delivery is not configured — copy the secure link below.",
    resetUrl,
  };
}

export async function resetPasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const tokenHash = hashToken(parsed.data.token);
  const reset = await db.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(parsed.data.password, 12);

  await db.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: reset.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: reset.id },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.deleteMany({
      where: {
        userId: reset.userId,
        usedAt: null,
        id: { not: reset.id },
      },
    });
  });

  const membership = await db.membership.findFirst({
    where: { userId: reset.userId },
    orderBy: { createdAt: "asc" },
  });

  await writeAuditLog({
    action: "auth.password_reset_completed",
    entityType: "user",
    entityId: reset.userId,
    summary: "Password was reset",
    organizationId: membership?.organizationId ?? null,
    actorId: reset.userId,
    actorEmail: reset.user.email,
    actorName: reset.user.name,
  });

  return { success: "Password updated. You can sign in now." };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const tenant = await requireTenant();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  });

  if (!parsed.success) {
    return {
      error: "Please fix the form errors.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const user = await db.user.findUnique({ where: { id: tenant.userId } });
  if (!user?.passwordHash) {
    return { error: "Password change is unavailable for this account." };
  }

  const valid = await compare(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return { error: "Current password is incorrect." };
  }

  const passwordHash = await hash(parsed.data.password, 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  await auditFromTenant(tenant, {
    action: "auth.password_changed",
    entityType: "user",
    entityId: user.id,
    summary: "Password changed from settings",
  });

  return { success: "Password updated." };
}
