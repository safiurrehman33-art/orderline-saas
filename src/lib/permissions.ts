import type { MembershipRole } from "@/generated/prisma/client";

export type Action =
  | "org:read"
  | "org:update"
  | "members:manage"
  | "activity:read"
  | "customers:read"
  | "customers:write"
  | "customers:delete"
  | "categories:read"
  | "categories:write"
  | "categories:delete"
  | "tables:read"
  | "tables:write"
  | "tables:delete"
  | "products:read"
  | "products:write"
  | "products:delete"
  | "orders:read"
  | "orders:write"
  | "orders:delete"
  | "orders:transition"
  | "pos:use"
  | "reports:read"
  | "pricing:read"
  | "pricing:write"
  | "whatsapp:read"
  | "whatsapp:manage";

const ALL: Action[] = [
  "org:read",
  "org:update",
  "members:manage",
  "activity:read",
  "customers:read",
  "customers:write",
  "customers:delete",
  "categories:read",
  "categories:write",
  "categories:delete",
  "tables:read",
  "tables:write",
  "tables:delete",
  "products:read",
  "products:write",
  "products:delete",
  "orders:read",
  "orders:write",
  "orders:delete",
  "orders:transition",
  "pos:use",
  "reports:read",
  "pricing:read",
  "pricing:write",
  "whatsapp:read",
  "whatsapp:manage",
];

const ROLE_ACTIONS: Record<MembershipRole, Action[]> = {
  OWNER: ALL,
  ADMIN: ALL,
  MEMBER: [
    "org:read",
    "activity:read",
    "customers:read",
    "customers:write",
    "categories:read",
    "tables:read",
    "tables:write",
    "products:read",
    "products:write",
    "orders:read",
    "orders:write",
    "orders:transition",
    "pos:use",
    "reports:read",
    "pricing:read",
    "whatsapp:read",
  ],
};

export function can(role: MembershipRole, action: Action) {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function assertCan(role: MembershipRole, action: Action) {
  if (!can(role, action)) {
    throw new Error("You do not have permission to perform this action.");
  }
}
