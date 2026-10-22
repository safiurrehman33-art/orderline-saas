import { auth } from "@/auth";
import { db } from "@/lib/db";
import { assertCan, type Action } from "@/lib/permissions";
import type { MembershipRole } from "@/generated/prisma/client";
import { redirect } from "next/navigation";

export type TenantContext = {
  userId: string;
  email: string;
  name: string | null | undefined;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: MembershipRole;
};

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireTenant(): Promise<TenantContext> {
  const session = await requireSession();
  const user = session.user;

  if (!user.organizationId || !user.role) {
    redirect("/onboarding");
  }

  return {
    userId: user.id,
    email: user.email ?? "",
    name: user.name,
    organizationId: user.organizationId,
    organizationName: user.organizationName ?? "Workspace",
    organizationSlug: user.organizationSlug ?? "",
    role: user.role,
  };
}

export async function requirePermission(action: Action) {
  const tenant = await requireTenant();
  assertCan(tenant.role, action);
  return tenant;
}

export async function getUserMemberships(userId: string) {
  return db.membership.findMany({
    where: { userId },
    include: {
      organization: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function ensureMembership(userId: string, organizationId: string) {
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: { userId, organizationId },
    },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!membership) {
    throw new Error("You are not a member of this organization.");
  }

  return membership;
}
