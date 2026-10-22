import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { formatAuditAction } from "@/lib/audit";

const entityHref = (entityType: string, entityId?: string | null) => {
  if (!entityId) return null;
  if (entityType === "customer") return `/customers/${entityId}`;
  if (entityType === "product") return `/products/${entityId}`;
  if (entityType === "order") return `/orders/${entityId}`;
  return null;
};

const toneFor = (action: string) => {
  if (action.includes("deleted") || action.includes("cancelled")) return "danger";
  if (action.includes("created") || action.includes("invited") || action.includes("activated"))
    return "success";
  if (action.includes("status") || action.includes("archived")) return "warning";
  return "neutral" as const;
};

export function ActivityItem({
  item,
}: {
  item: {
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    actorName: string | null;
    actorEmail: string | null;
    createdAt: Date;
  };
}) {
  const href = entityHref(item.entityType, item.entityId);
  const actor = item.actorName || item.actorEmail || "System";

  return (
    <li className="flex gap-3 px-5 py-3.5">
      <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={toneFor(item.action)}>{formatAuditAction(item.action)}</Badge>
          <span className="text-xs text-muted">
            {formatDistanceToNow(item.createdAt, { addSuffix: true })}
          </span>
        </div>
        <p className="mt-1 text-sm text-foreground">
          {href ? (
            <Link href={href} className="hover:text-accent hover:underline">
              {item.summary}
            </Link>
          ) : (
            item.summary
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">by {actor}</p>
      </div>
    </li>
  );
}
