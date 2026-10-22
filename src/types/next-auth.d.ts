import type { MembershipRole } from "@/generated/prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      organizationId: string;
      organizationName: string;
      organizationSlug: string;
      role: MembershipRole;
      isSuperAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    role?: MembershipRole;
    isSuperAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    organizationId?: string;
    organizationName?: string;
    organizationSlug?: string;
    role?: MembershipRole;
    isSuperAdmin?: boolean;
  }
}
