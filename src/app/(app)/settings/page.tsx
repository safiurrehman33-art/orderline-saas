import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import {
  getOrganizationSettings,
  inviteMemberAction,
  updateOrganizationAction,
} from "@/lib/actions/organization";
import { changePasswordAction } from "@/lib/actions/auth";
import { can } from "@/lib/permissions";
import { MemberActions } from "@/components/settings/member-actions";
import { OrgForm } from "@/components/settings/org-form";
import { InviteForm } from "@/components/settings/invite-form";
import { ChangePasswordForm } from "@/components/auth/password-forms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const { tenant, organization, members, invites } =
    await getOrganizationSettings();
  const canManage = can(tenant.role, "members:manage");
  const canUpdateOrg = can(tenant.role, "org:update");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Organization profile, security, members, and access control."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold">Organization</h2>
          <p className="mt-1 text-sm text-muted">
            Slug: <span className="font-mono">{organization.slug}</span>
          </p>
          {canUpdateOrg ? (
            <div className="mt-5">
              <OrgForm
                action={updateOrganizationAction}
                defaultName={organization.name}
                logoUrl={organization.logoUrl}
              />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm">{organization.name}</p>
              {organization.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={organization.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl border border-line object-contain p-1"
                />
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold">Password</h2>
          <p className="mt-1 text-sm text-muted">
            Change the password for {tenant.email}.
          </p>
          <div className="mt-5">
            <ChangePasswordForm action={changePasswordAction} />
          </div>
        </section>

        <section className="rounded-xl border border-line bg-surface p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold">Invite member</h2>
          <p className="mt-1 text-sm text-muted">
            Existing users are added instantly. New emails get a temporary
            password (shown once).
          </p>
          {canManage ? (
            <div className="mt-5">
              <InviteForm action={inviteMemberAction} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              You need ADMIN or OWNER to manage members.
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-xl border border-line bg-surface">
        <div className="border-b border-line px-6 py-4">
          <h2 className="text-lg font-semibold">Members</h2>
        </div>
        <div className="divide-y divide-line">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-sm text-muted">{member.user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={member.role === "OWNER" ? "accent" : "neutral"}>
                  {member.role}
                </Badge>
                {canManage && member.role !== "OWNER" ? (
                  <MemberActions
                    membershipId={member.id}
                    role={member.role}
                  />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {invites.length > 0 ? (
        <section className="mt-6 rounded-xl border border-line bg-surface p-6">
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <ul className="mt-4 space-y-2">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {invite.email} · {invite.role}
                </span>
                <span className="text-muted">
                  expires {invite.expiresAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
