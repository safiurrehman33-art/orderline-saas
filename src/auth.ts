import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import type { MembershipRole } from "@/generated/prisma/client";

async function resolveMembership(userId: string, preferredOrgId?: string | null) {
  if (preferredOrgId) {
    const preferred = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: preferredOrgId,
        },
      },
      include: {
        organization: { select: { id: true, name: true, slug: true } },
      },
    });
    if (preferred) return preferred;
  }

  return db.membership.findFirst({
    where: { userId },
    include: {
      organization: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required on Vercel / reverse proxies so Auth.js trusts the host header.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await compare(parsed.data.password, user.passwordHash);
        if (!valid) return null;

        const membership = await resolveMembership(user.id);
        if (!membership && !user.isSuperAdmin) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          organizationId: membership?.organization.id ?? "",
          organizationName: membership?.organization.name ?? "",
          organizationSlug: membership?.organization.slug ?? "",
          role: membership?.role ?? "MEMBER",
          isSuperAdmin: user.isSuperAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id!;
        token.organizationId = user.organizationId;
        token.organizationName = user.organizationName;
        token.organizationSlug = user.organizationSlug;
        token.role = user.role;
        token.isSuperAdmin = Boolean(user.isSuperAdmin);
      }

      if (trigger === "update" && session?.organizationId && token.id) {
        const membership = await resolveMembership(
          token.id,
          session.organizationId as string,
        );
        if (membership) {
          token.organizationId = membership.organization.id;
          token.organizationName = membership.organization.name;
          token.organizationSlug = membership.organization.slug;
          token.role = membership.role as MembershipRole;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.organizationId = token.organizationId ?? "";
        session.user.organizationName = token.organizationName ?? "";
        session.user.organizationSlug = token.organizationSlug ?? "";
        session.user.role = (token.role as MembershipRole) ?? "MEMBER";
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin);
      }
      return session;
    },
  },
});
