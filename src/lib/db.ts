import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** Bump when Prisma models/enums change so Hot Reload drops a stale client. */
const PRISMA_CLIENT_REV = "cms-super-admin-v1";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRev: string | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and run npm run db:setup against local PostgreSQL.",
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

function clientLooksStale(client: PrismaClient) {
  // Hot reload can keep an old engine that predates newer models/fields.
  if (typeof (client as { deal?: { findMany?: unknown } }).deal?.findMany !== "function") {
    return true;
  }
  try {
    const fields = (
      client as unknown as {
        _runtimeDataModel?: {
          models?: { Organization?: { fields?: Record<string, unknown> } };
        };
      }
    )._runtimeDataModel?.models?.Organization?.fields;
    if (fields && !("logoUrl" in fields)) return true;
  } catch {
    // ignore — recreate on next explicit rev bump
  }
  return false;
}

function getClient() {
  const existing = globalForPrisma.prisma;
  const staleRev = globalForPrisma.prismaRev !== PRISMA_CLIENT_REV;
  const staleShape = existing ? clientLooksStale(existing) : true;

  if (!existing || staleRev || staleShape) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaRev = PRISMA_CLIENT_REV;
  }
  return globalForPrisma.prisma!;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
