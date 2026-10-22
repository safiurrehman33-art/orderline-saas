import { getPosCatalog } from "@/lib/actions/pos";
import { PosTerminal } from "@/components/pos/pos-terminal";

export const metadata = { title: "POS" };

export default async function PosPage() {
  const { tenant, categories, products, tables, deals, customers, pricing } =
    await getPosCatalog();

  return (
    <PosTerminal
      organizationName={tenant.organizationName}
      pricing={pricing}
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        color: c.color,
        imageUrl: c.imageUrl,
      }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        priceCents: p.priceCents,
        currency: p.currency,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        trackStock: p.trackStock,
        stockQty: p.stockQty,
        description: p.description,
      }))}
      tables={tables.map((t) => ({
        id: t.id,
        name: t.name,
        code: t.code,
        seats: t.seats,
        status: t.status,
        section: t.section,
      }))}
      deals={deals.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        priceCents: d.priceCents,
        compareAtCents: d.compareAtCents,
        imageUrl: d.imageUrl,
        description: d.description,
        items: d.items.map((item) => ({
          quantity: item.quantity,
          productName: item.product.name,
        })),
      }))}
      customers={customers}
    />
  );
}
