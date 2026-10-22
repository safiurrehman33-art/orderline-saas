import { requirePermission } from "@/lib/tenant";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("pos:use");
  return children;
}
