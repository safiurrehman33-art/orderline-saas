export const REPORT_TYPES = [
  "sales",
  "orders",
  "products",
  "customers",
  "order-types",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type ReportColumn = {
  key: string;
  label: string;
};

export type ReportRow = Record<string, string | number | null>;

export type ReportDefinition = {
  type: ReportType;
  title: string;
  description: string;
  columns: ReportColumn[];
};

export const REPORT_CATALOG: ReportDefinition[] = [
  {
    type: "sales",
    title: "Sales & revenue",
    description:
      "Daily revenue, order volume, and average ticket for the selected range.",
    columns: [
      { key: "date", label: "Date" },
      { key: "orders", label: "Orders" },
      { key: "revenue", label: "Revenue" },
      { key: "avgTicket", label: "Avg ticket" },
      { key: "fulfilled", label: "Fulfilled" },
      { key: "cancelled", label: "Cancelled" },
    ],
  },
  {
    type: "orders",
    title: "Order report",
    description:
      "Line-level order history with status, type, customer, and totals.",
    columns: [
      { key: "orderNumber", label: "Order #" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
      { key: "orderType", label: "Type" },
      { key: "customer", label: "Customer" },
      { key: "items", label: "Items" },
      { key: "total", label: "Total" },
    ],
  },
  {
    type: "products",
    title: "Product performance",
    description: "Best-selling items by quantity and revenue in range.",
    columns: [
      { key: "product", label: "Product" },
      { key: "sku", label: "SKU" },
      { key: "qty", label: "Qty sold" },
      { key: "revenue", label: "Revenue" },
      { key: "orders", label: "Orders" },
    ],
  },
  {
    type: "customers",
    title: "Customer report",
    description: "Customer spend, order count, and last order date.",
    columns: [
      { key: "customer", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "orders", label: "Orders" },
      { key: "spent", label: "Total spent" },
      { key: "lastOrder", label: "Last order" },
    ],
  },
  {
    type: "order-types",
    title: "Order type mix",
    description: "Dine-in vs takeaway vs delivery volume and revenue.",
    columns: [
      { key: "orderType", label: "Order type" },
      { key: "orders", label: "Orders" },
      { key: "revenue", label: "Revenue" },
      { key: "share", label: "Share %" },
    ],
  },
];

export function getReportDefinition(type: string) {
  return REPORT_CATALOG.find((r) => r.type === type) ?? null;
}
