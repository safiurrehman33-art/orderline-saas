"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { formatMoney, cn } from "@/lib/utils";
import type { PricingConfig } from "@/lib/pricing";
import type { OrderType } from "@/generated/prisma/client";

export type PosReceiptPayload = {
  orderId: string;
  orderNumber: string;
  organizationName: string;
  logoUrl: string | null;
  orderType: OrderType;
  tableCode: string | null;
  guestCount: number;
  notes: string | null;
  placedAt: string;
  cashierName?: string | null;
  customer: {
    name: string;
    phone: string | null;
    address: string | null;
  } | null;
  items: {
    name: string;
    sku: string;
    quantity: number;
    unitCents: number;
    totalCents: number;
  }[];
  pricing: PricingConfig;
  subtotalCents: number;
  salesTaxCents: number;
  vatCents: number;
  serviceCents: number;
  taxCents: number;
  totalCents: number;
};

const TYPE_LABEL: Record<OrderType, string> = {
  DINE_IN: "DINE-IN",
  TAKEAWAY: "TAKEAWAY",
  DELIVERY: "DELIVERY",
};

function dash(char = "-", width = 32) {
  return char.repeat(width);
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildPrintDocument(receipt: PosReceiptPayload) {
  const rows: string[] = [];
  const pushRow = (label: string, value: string) => {
    rows.push(
      `<div class="row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`,
    );
  };

  pushRow("Order", receipt.orderNumber);
  pushRow("Date", formatWhen(receipt.placedAt));
  pushRow("Type", TYPE_LABEL[receipt.orderType]);
  if (receipt.tableCode) pushRow("Table", receipt.tableCode);
  if (receipt.orderType === "DINE_IN") {
    pushRow("Guests", String(receipt.guestCount));
  }
  if (receipt.cashierName) pushRow("Cashier", receipt.cashierName);

  let customerBlock = "";
  if (receipt.customer) {
    const parts = [
      `<div class="row"><span>Customer</span><span>${escapeHtml(receipt.customer.name)}</span></div>`,
    ];
    if (receipt.customer.phone) {
      parts.push(
        `<div class="row"><span>Phone</span><span>${escapeHtml(receipt.customer.phone)}</span></div>`,
      );
    }
    if (receipt.customer.address) {
      parts.push(
        `<p class="addr">${escapeHtml(receipt.customer.address)}</p>`,
      );
    }
    customerBlock = `<div class="sep">${dash()}</div>${parts.join("")}`;
  }

  const items = receipt.items
    .map(
      (item) => `
      <div class="item">
        <div class="row">
          <span class="name">${escapeHtml(item.name.toUpperCase())}</span>
          <span>${escapeHtml(formatMoney(item.totalCents))}</span>
        </div>
        <div class="meta">
          <span>${item.quantity} x ${escapeHtml(formatMoney(item.unitCents))}</span>
          <span>${escapeHtml(item.sku)}</span>
        </div>
      </div>`,
    )
    .join("");

  const taxRows: string[] = [];
  if (receipt.pricing.taxEnabled && receipt.salesTaxCents > 0) {
    taxRows.push(
      `<div class="row"><span>Sales tax ${receipt.pricing.salesTaxPercent}%</span><span>${escapeHtml(formatMoney(receipt.salesTaxCents))}</span></div>`,
    );
  }
  if (receipt.pricing.taxEnabled && receipt.vatCents > 0) {
    taxRows.push(
      `<div class="row"><span>VAT ${receipt.pricing.vatPercent}%</span><span>${escapeHtml(formatMoney(receipt.vatCents))}</span></div>`,
    );
  }
  if (receipt.pricing.taxEnabled && receipt.serviceCents > 0) {
    taxRows.push(
      `<div class="row"><span>Service ${receipt.pricing.serviceChargePercent}%</span><span>${escapeHtml(formatMoney(receipt.serviceCents))}</span></div>`,
    );
  }

  const notesBlock = receipt.notes
    ? `<div class="sep">${dash()}</div><p class="note"><strong>NOTE:</strong> ${escapeHtml(receipt.notes)}</p>`
    : "";

  const logo = receipt.logoUrl
    ? `<img src="${escapeHtml(receipt.logoUrl)}" alt="" class="logo" />`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(receipt.orderNumber)}</title>
  <style>
    @page { size: 80mm auto; margin: 3mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #fff;
      color: #000;
      font-family: "Courier New", Courier, ui-monospace, monospace;
      font-size: 11px;
      line-height: 1.35;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .slip { width: 72mm; max-width: 100%; margin: 0 auto; padding: 2mm 1mm; }
    .center { text-align: center; }
    .logo { display: block; width: 48px; height: 48px; object-fit: contain; margin: 0 auto 6px; }
    .brand { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
    .sub { margin-top: 2px; font-size: 10px; text-transform: uppercase; color: #444; }
    .sep { margin: 8px 0; text-align: center; color: #777; letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; }
    .row { display: flex; justify-content: space-between; gap: 8px; margin: 1px 0; }
    .row span:last-child { text-align: right; font-variant-numeric: tabular-nums; }
    .addr { margin-top: 4px; font-size: 10px; color: #333; word-break: break-word; }
    .head { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; text-transform: uppercase; color: #555; margin-bottom: 4px; }
    .item { margin: 6px 0; }
    .name { font-weight: 700; flex: 1; min-width: 0; }
    .meta { display: flex; justify-content: space-between; font-size: 10px; color: #555; }
    .total { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 2px; font-size: 14px; font-weight: 700; }
    .note { font-size: 10px; }
    .thanks { margin-top: 4px; text-align: center; font-size: 10px; color: #555; line-height: 1.45; }
    .bars { margin-top: 10px; font-size: 14px; letter-spacing: 0.12em; color: #000; }
    .code { margin-top: 4px; font-weight: 700; letter-spacing: 0.08em; color: #000; }
    .cut { margin-top: 10px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.18em; color: #999; }
  </style>
</head>
<body>
  <div class="slip">
    <div class="center">
      ${logo}
      <div class="brand">${escapeHtml(receipt.organizationName)}</div>
      <div class="sub">Sales receipt</div>
    </div>
    <div class="sep">${dash()}</div>
    ${rows.join("")}
    ${customerBlock}
    <div class="sep">${dash()}</div>
    <div class="head"><span>Item</span><span>Amt</span></div>
    ${items}
    <div class="sep">${dash()}</div>
    <div class="row"><span>Subtotal</span><span>${escapeHtml(formatMoney(receipt.subtotalCents))}</span></div>
    ${taxRows.join("")}
    <div class="sep">${dash("=")}</div>
    <div class="total"><span>TOTAL</span><span>${escapeHtml(formatMoney(receipt.totalCents))}</span></div>
    ${notesBlock}
    <div class="sep">${dash()}</div>
    <div class="thanks">
      <div>*** Thank you ***</div>
      <div>Please keep this slip</div>
      <div class="bars">||||||||||||||||||||</div>
      <div class="code">${escapeHtml(receipt.orderNumber)}</div>
      <div class="cut">${dash("·", 28)}<br/>cut here</div>
    </div>
  </div>
</body>
</html>`;
}

export function PosReceiptModal({
  receipt,
  onClose,
}: {
  receipt: PosReceiptPayload;
  onClose: () => void;
}) {
  const printingRef = useRef(false);

  function handlePrint() {
    if (printingRef.current) return;
    printingRef.current = true;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument;
    const win = iframe.contentWindow;
    if (!doc || !win) {
      iframe.remove();
      printingRef.current = false;
      return;
    }

    doc.open();
    doc.write(buildPrintDocument(receipt));
    doc.close();

    const cleanup = () => {
      printingRef.current = false;
      iframe.remove();
    };

    const runPrint = () => {
      try {
        win.focus();
        win.print();
      } finally {
        // Give the print dialog a moment, then remove the iframe
        window.setTimeout(cleanup, 500);
      }
    };

    const images = Array.from(doc.images);
    if (images.length === 0) {
      window.setTimeout(runPrint, 50);
      return;
    }

    let pending = images.length;
    const done = () => {
      pending -= 1;
      if (pending <= 0) runPrint();
    };
    for (const img of images) {
      if (img.complete) done();
      else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Generate receipt</p>
            <p className="text-xs text-white/45">{receipt.orderNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#e11d48] px-3 text-xs font-bold text-white hover:bg-[#be123c]"
            >
              <Printer className="h-3.5 w-3.5" />
              Generate receipt
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="scroll-dark min-h-0 flex-1 overflow-y-auto bg-[#111827] p-4">
          <div
            className={cn(
              "mx-auto w-[280px] bg-white px-3 py-4 text-black shadow-lg",
              "font-mono text-[11px] leading-[1.35] tracking-tight",
            )}
          >
            {/* Header */}
            <div className="text-center">
              {receipt.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={receipt.logoUrl}
                  alt=""
                  className="mx-auto mb-2 h-12 w-12 object-contain"
                />
              ) : null}
              <p className="text-sm font-bold uppercase tracking-wide">
                {receipt.organizationName}
              </p>
              <p className="mt-0.5 text-[10px] uppercase text-neutral-600">
                Sales receipt
              </p>
            </div>

            <p className="my-2 text-center text-neutral-500">{dash()}</p>

            <div className="space-y-0.5">
              <Row label="Order" value={receipt.orderNumber} />
              <Row label="Date" value={formatWhen(receipt.placedAt)} />
              <Row label="Type" value={TYPE_LABEL[receipt.orderType]} />
              {receipt.tableCode ? (
                <Row label="Table" value={receipt.tableCode} />
              ) : null}
              {receipt.orderType === "DINE_IN" ? (
                <Row label="Guests" value={String(receipt.guestCount)} />
              ) : null}
              {receipt.cashierName ? (
                <Row label="Cashier" value={receipt.cashierName} />
              ) : null}
            </div>

            {receipt.customer ? (
              <>
                <p className="my-2 text-center text-neutral-500">{dash()}</p>
                <div className="space-y-0.5">
                  <Row label="Customer" value={receipt.customer.name} />
                  {receipt.customer.phone ? (
                    <Row label="Phone" value={receipt.customer.phone} />
                  ) : null}
                  {receipt.customer.address ? (
                    <p className="mt-1 break-words text-[10px] text-neutral-700">
                      {receipt.customer.address}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            <p className="my-2 text-center text-neutral-500">{dash()}</p>

            <div className="mb-1 flex justify-between text-[10px] font-bold uppercase text-neutral-600">
              <span>Item</span>
              <span>Amt</span>
            </div>

            <ul className="space-y-2">
              {receipt.items.map((item, index) => (
                <li key={`${item.sku}-${index}`}>
                  <div className="flex justify-between gap-2">
                    <span className="min-w-0 flex-1 font-semibold uppercase">
                      {item.name}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      {formatMoney(item.totalCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-neutral-600">
                    <span>
                      {item.quantity} x {formatMoney(item.unitCents)}
                    </span>
                    <span>{item.sku}</span>
                  </div>
                </li>
              ))}
            </ul>

            <p className="my-2 text-center text-neutral-500">{dash()}</p>

            <div className="space-y-0.5">
              <Row
                label="Subtotal"
                value={formatMoney(receipt.subtotalCents)}
              />
              {receipt.pricing.taxEnabled && receipt.salesTaxCents > 0 ? (
                <Row
                  label={`Sales tax ${receipt.pricing.salesTaxPercent}%`}
                  value={formatMoney(receipt.salesTaxCents)}
                />
              ) : null}
              {receipt.pricing.taxEnabled && receipt.vatCents > 0 ? (
                <Row
                  label={`VAT ${receipt.pricing.vatPercent}%`}
                  value={formatMoney(receipt.vatCents)}
                />
              ) : null}
              {receipt.pricing.taxEnabled && receipt.serviceCents > 0 ? (
                <Row
                  label={`Service ${receipt.pricing.serviceChargePercent}%`}
                  value={formatMoney(receipt.serviceCents)}
                />
              ) : null}
            </div>

            <p className="my-2 text-center text-neutral-500">{dash("=")}</p>

            <div className="flex items-end justify-between text-sm font-bold">
              <span>TOTAL</span>
              <span className="tabular-nums">
                {formatMoney(receipt.totalCents)}
              </span>
            </div>

            {receipt.notes ? (
              <>
                <p className="my-2 text-center text-neutral-500">{dash()}</p>
                <p className="text-[10px]">
                  <span className="font-bold">NOTE:</span> {receipt.notes}
                </p>
              </>
            ) : null}

            <p className="my-2 text-center text-neutral-500">{dash()}</p>

            <div className="text-center text-[10px] leading-4 text-neutral-600">
              <p>*** Thank you ***</p>
              <p>Please keep this slip</p>
              <p className="mt-3 font-mono text-[14px] tracking-[0.12em] text-black">
                ||||||||||||||||||||
              </p>
              <p className="mt-1 font-bold tracking-wider text-black">
                {receipt.orderNumber}
              </p>
              <p className="mt-3 text-[9px] text-neutral-400">
                {dash("·", 28)}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-neutral-400">
                cut here
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#e11d48] text-sm font-bold text-white hover:bg-[#be123c]"
          >
            <Printer className="h-4 w-4" />
            Generate receipt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-600">{label}</span>
      <span className="text-right font-medium tabular-nums">{value}</span>
    </div>
  );
}
