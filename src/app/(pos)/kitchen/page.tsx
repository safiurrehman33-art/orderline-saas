import { getKitchenOrders } from "@/lib/actions/pos";
import { KitchenBoard } from "@/components/kitchen/kitchen-board";

export const metadata = { title: "Kitchen" };

export default async function KitchenPage() {
  const { tenant, orders } = await getKitchenOrders();

  return (
    <KitchenBoard
      organizationName={tenant.organizationName}
      orders={orders.map((order) => ({
        ...order,
        placedAt: order.placedAt?.toISOString() ?? null,
        createdAt: order.createdAt.toISOString(),
      }))}
    />
  );
}
