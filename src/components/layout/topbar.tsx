"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LogOut, Building2 } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type MembershipOption = {
  organizationId: string;
  name: string;
  role: string;
};

export function Topbar({
  memberships,
}: {
  memberships: MembershipOption[];
}) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const user = session?.user;

  async function onSwitchOrg(organizationId: string) {
    if (!organizationId || organizationId === user?.organizationId) return;
    await update({ organizationId });
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Building2 className="h-4 w-4 text-muted" />
        <select
          className="h-9 max-w-[220px] rounded-lg border border-line bg-surface px-3 text-sm outline-none focus:border-accent"
          value={user?.organizationId ?? ""}
          onChange={(e) => onSwitchOrg(e.target.value)}
        >
          {memberships.map((m) => (
            <option key={m.organizationId} value={m.organizationId}>
              {m.name}
            </option>
          ))}
        </select>
        {user?.role ? <Badge tone="accent">{user.role}</Badge> : null}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium">{user?.name ?? "User"}</p>
          <p className="text-xs text-muted">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
          {initials(user?.name || user?.email || "OL")}
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="ghost" size="sm" aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
