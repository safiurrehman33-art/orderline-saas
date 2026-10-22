"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/organization";
import { Button } from "@/components/ui/button";
import type { MembershipRole } from "@/generated/prisma/client";

export function MemberActions({
  membershipId,
  role,
}: {
  membershipId: string;
  role: MembershipRole;
}) {
  const router = useRouter();

  async function onRoleChange(next: MembershipRole) {
    try {
      await updateMemberRoleAction(membershipId, next);
      toast.success("Role updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    }
  }

  async function onRemove() {
    if (!confirm("Remove this member from the organization?")) return;
    try {
      await removeMemberAction(membershipId);
      toast.success("Member removed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="h-8 rounded-md border border-line bg-surface px-2 text-xs"
        value={role}
        onChange={(e) => onRoleChange(e.target.value as MembershipRole)}
      >
        <option value="MEMBER">MEMBER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <Button variant="ghost" size="sm" onClick={onRemove}>
        Remove
      </Button>
    </div>
  );
}
