import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { TenantContext } from "@/lib/tenant";

export type AuditInput = {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
  organizationId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata ?? undefined,
        organizationId: input.organizationId ?? null,
        actorId: input.actorId ?? null,
        actorEmail: input.actorEmail ?? null,
        actorName: input.actorName ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}

export function auditFromTenant(
  tenant: TenantContext,
  input: Omit<AuditInput, "organizationId" | "actorId" | "actorEmail" | "actorName">,
) {
  return writeAuditLog({
    ...input,
    organizationId: tenant.organizationId,
    actorId: tenant.userId,
    actorEmail: tenant.email,
    actorName: tenant.name ?? null,
  });
}

export function formatAuditAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .join(" · ");
}
