"use server";

import { db } from "@/lib/db";
import { requirePermission } from "@/lib/tenant";
import type { Prisma } from "@/generated/prisma/client";

export async function listActivity(params: {
  q?: string;
  entityType?: string;
  page?: number;
  pageSize?: number;
}) {
  const tenant = await requirePermission("activity:read");
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(50, Math.max(5, params.pageSize ?? 20));

  const where: Prisma.AuditLogWhereInput = {
    organizationId: tenant.organizationId,
  };

  if (params.entityType && params.entityType !== "all") {
    where.entityType = params.entityType;
  }

  if (params.q?.trim()) {
    const q = params.q.trim();
    where.OR = [
      { summary: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, items] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
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

export async function getRecentActivity(limit = 8) {
  const tenant = await requirePermission("activity:read");
  return db.auditLog.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
