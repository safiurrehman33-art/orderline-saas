import { redirect } from "next/navigation";
import { auth } from "@/auth";

export async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/super-admin/login");
  }
  if (!session.user.isSuperAdmin) {
    redirect("/dashboard");
  }
  return session;
}
