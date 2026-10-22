"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Lock, Move, Users, Sparkles, RotateCcw } from "lucide-react";
import { cn, formatMoney } from "@/lib/utils";
import {
  autoArrangeTablesAction,
  setTableStatusAction,
  updateTablePositionAction,
} from "@/lib/actions/tables";
import { floorGridPosition } from "@/lib/tables/layout";
import type { TableStatus } from "@/generated/prisma/client";

export type FloorTable = {
  id: string;
  name: string;
  code: string;
  seats: number;
  status: TableStatus;
  section: string | null;
  shape: string;
  posX: number;
  posY: number;
  orders: {
    id: string;
    orderNumber: string;
    status: string;
    totalCents: number;
    guestCount: number;
  }[];
};

const STATUS_STYLE: Record<
  TableStatus,
  { fill: string; ring: string; glow: string; label: string }
> = {
  AVAILABLE: {
    fill: "from-emerald-400/90 to-teal-500/90",
    ring: "ring-emerald-300/60",
    glow: "shadow-emerald-400/40",
    label: "Available",
  },
  OCCUPIED: {
    fill: "from-rose-500/95 to-orange-500/90",
    ring: "ring-rose-300/50",
    glow: "shadow-rose-500/45",
    label: "Occupied",
  },
  RESERVED: {
    fill: "from-amber-400/95 to-orange-400/90",
    ring: "ring-amber-300/50",
    glow: "shadow-amber-400/40",
    label: "Reserved",
  },
  CLEANING: {
    fill: "from-slate-400/90 to-slate-500/90",
    ring: "ring-slate-300/40",
    glow: "shadow-slate-400/30",
    label: "Cleaning",
  },
};

const STATUSES: TableStatus[] = [
  "AVAILABLE",
  "OCCUPIED",
  "RESERVED",
  "CLEANING",
];

function tableSize(seats: number, shape: string) {
  const base = 72 + Math.min(seats, 10) * 4;
  if (shape === "RECT") return { w: base * 1.35, h: base * 0.85 };
  if (shape === "SQUARE" || shape === "ROUND") return { w: base, h: base };
  return { w: base * 1.25, h: base * 0.95 };
}

const CloudTableNode = memo(function CloudTableNode({
  table,
  selected,
  dragging,
  canEdit,
  nodeRef,
  onPointerDown,
  onSelect,
}: {
  table: FloorTable;
  selected: boolean;
  dragging: boolean;
  canEdit: boolean;
  nodeRef: (el: HTMLButtonElement | null) => void;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  onSelect: (id: string) => void;
}) {
  const style = STATUS_STYLE[table.status];
  const size = tableSize(table.seats, table.shape);
  const open = table.orders[0];
  const radius =
    table.shape === "SQUARE"
      ? "rounded-2xl"
      : table.shape === "RECT"
        ? "rounded-3xl"
        : table.shape === "ROUND"
          ? "rounded-full"
          : "rounded-[45%]";

  return (
    <button
      type="button"
      ref={nodeRef}
      data-table-id={table.id}
      onPointerDown={(e) => {
        if (!canEdit) return;
        onPointerDown(e, table.id);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(table.id);
      }}
      style={{
        left: table.posX,
        top: table.posY,
        width: size.w,
        height: size.h,
        willChange: dragging ? "left, top, transform" : undefined,
      }}
      className={cn(
        "absolute select-none touch-none outline-none",
        dragging
          ? "z-30 scale-105 cursor-grabbing transition-none"
          : "z-10 transition-transform duration-200 hover:z-20 hover:scale-[1.03]",
        canEdit ? "cursor-grab" : "cursor-pointer",
      )}
    >
      <span className="absolute inset-x-2 bottom-0 h-4 rounded-full bg-black/35 blur-md" />
      <span
        className={cn(
          "absolute inset-0 bg-gradient-to-br ring-2 backdrop-blur-sm shadow-xl",
          radius,
          style.fill,
          style.ring,
          style.glow,
          selected && "ring-4 ring-white/80",
          table.status === "OCCUPIED" && !dragging && "animate-[tablePulse_2.4s_ease-in-out_infinite]",
        )}
      />
      <span className={cn("pointer-events-none absolute inset-[10%] bg-white/15", radius)} />
      <span className="relative z-10 flex h-full flex-col items-center justify-center px-2 text-center text-white">
        <span className="text-lg font-black tracking-tight drop-shadow-sm">
          {table.code}
        </span>
        <span className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-semibold opacity-90">
          <Users className="h-3 w-3" />
          {table.seats}
        </span>
        {open ? (
          <span className="mt-1 max-w-full truncate rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold">
            {open.orderNumber.replace(/^ORD-\d+-/, "#")}
          </span>
        ) : null}
      </span>
    </button>
  );
});

export function FloorPlan({
  tables: initialTables,
  canEdit,
}: {
  tables: FloorTable[];
  canEdit: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [tables, setTables] = useState(initialTables);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editLayout, setEditLayout] = useState(true);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const posRef = useRef(new Map<string, { x: number; y: number }>());

  useEffect(() => {
    setTables(initialTables);
    const map = new Map<string, { x: number; y: number }>();
    for (const t of initialTables) map.set(t.id, { x: t.posX, y: t.posY });
    posRef.current = map;
  }, [initialTables]);

  const selected = useMemo(
    () => tables.find((t) => t.id === selectedId) ?? null,
    [tables, selectedId],
  );

  const counts = useMemo(() => {
    const map: Record<TableStatus, number> = {
      AVAILABLE: 0,
      OCCUPIED: 0,
      RESERVED: 0,
      CLEANING: 0,
    };
    for (const t of tables) map[t.status] += 1;
    return map;
  }, [tables]);

  const bindNodeRef = useCallback(
    (id: string) => (el: HTMLButtonElement | null) => {
      if (el) nodeRefs.current.set(id, el);
      else nodeRefs.current.delete(id);
    },
    [],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (!canEdit || !editLayout || !canvasRef.current) return;
      e.preventDefault();
      e.stopPropagation();

      const pos = posRef.current.get(id) ?? { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      dragRef.current = {
        id,
        offsetX: e.clientX - rect.left - canvasRef.current.scrollLeft - pos.x,
        offsetY: e.clientY - rect.top - canvasRef.current.scrollTop - pos.y,
      };
      setDraggingId(id);
      setSelectedId(id);
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canEdit, editLayout],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.max(
      8,
      e.clientX - rect.left - canvas.scrollLeft - drag.offsetX,
    );
    const y = Math.max(
      8,
      e.clientY - rect.top - canvas.scrollTop - drag.offsetY,
    );

    posRef.current.set(drag.id, { x, y });
    const el = nodeRefs.current.get(drag.id);
    if (el) {
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) {
      setDraggingId(null);
      return;
    }

    const pos = posRef.current.get(drag.id);
    setDraggingId(null);
    if (!pos) return;

    // Sync React state once after drag (not during render)
    setTables((prev) =>
      prev.map((t) =>
        t.id === drag.id ? { ...t, posX: pos.x, posY: pos.y } : t,
      ),
    );

    void updateTablePositionAction(drag.id, pos.x, pos.y).then((result) => {
      if (result.error) toast.error(result.error);
    });
  }, []);

  function autoArrange() {
    if (!canEdit) return;
    const next = tables.map((table, index) => {
      const { posX, posY } = floorGridPosition(index);
      return { ...table, posX, posY };
    });
    for (const table of next) {
      posRef.current.set(table.id, { x: table.posX, y: table.posY });
      const el = nodeRefs.current.get(table.id);
      if (el) {
        el.style.left = `${table.posX}px`;
        el.style.top = `${table.posY}px`;
      }
    }
    setTables(next);
    startTransition(async () => {
      const result = await autoArrangeTablesAction();
      if ("error" in result && result.error) {
        toast.error(String(result.error));
        return;
      }
      toast.success("Floor auto-arranged");
    });
  }

  function setStatus(status: TableStatus) {
    if (!selected || !canEdit) return;
    const id = selected.id;
    const code = selected.code;
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t)),
    );
    startTransition(async () => {
      try {
        await setTableStatusAction(id, status);
        toast.success(`${code} → ${STATUS_STYLE[status].label}`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Status update failed",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((status) => (
            <span
              key={status}
              className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground ring-1 ring-line"
            >
              <span
                className={cn(
                  "h-2.5 w-2.5 rounded-full bg-gradient-to-br shadow-sm",
                  STATUS_STYLE[status].fill,
                )}
              />
              {STATUS_STYLE[status].label}
              <span className="tabular-nums text-muted">{counts[status]}</span>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setEditLayout((v) => !v)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ring-1 transition",
                  editLayout
                    ? "bg-accent text-white ring-accent"
                    : "bg-surface text-muted ring-line hover:text-foreground",
                )}
              >
                {editLayout ? (
                  <Move className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
                {editLayout ? "Layout unlocked" : "Layout locked"}
              </button>
              <button
                type="button"
                onClick={autoArrange}
                disabled={pending}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-surface px-3 text-xs font-semibold text-muted ring-1 ring-line transition hover:text-foreground disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Auto arrange
              </button>
            </>
          ) : null}
          <span className="inline-flex items-center gap-1 text-[11px] text-muted">
            <Sparkles className="h-3 w-3 text-accent" />
            Drag tables on the floor map
          </span>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_280px]">
        <div
          ref={canvasRef}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={() => setSelectedId(null)}
          className="scroll-light relative h-[min(72vh,720px)] overflow-auto rounded-2xl border border-line shadow-inner"
        >
          <div
            className="relative min-h-[900px] min-w-[1200px]"
            style={{
              backgroundColor: "#1a2332",
              backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% -10%, rgba(15,107,76,0.25), transparent 55%),
                radial-gradient(circle at 20% 80%, rgba(225,29,72,0.12), transparent 40%),
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: "auto, auto, 40px 40px, 40px 40px",
            }}
          >
            <div className="pointer-events-none absolute left-6 top-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/25">
              Dining floor
            </div>
            <div className="pointer-events-none absolute bottom-6 right-6 rounded-full bg-white/5 px-3 py-1 text-[10px] text-white/30 ring-1 ring-white/10">
              Cloud table layout · live status
            </div>

            {tables.map((table) => (
              <CloudTableNode
                key={table.id}
                table={table}
                selected={selectedId === table.id}
                dragging={draggingId === table.id}
                canEdit={canEdit && editLayout}
                nodeRef={bindNodeRef(table.id)}
                onPointerDown={onPointerDown}
                onSelect={setSelectedId}
              />
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-line bg-surface p-4">
          {selected ? (
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Selected table
                </p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight">
                  {selected.code}
                </h3>
                <p className="text-sm text-muted">{selected.name}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-xs font-semibold ring-1 ring-line">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full bg-gradient-to-br",
                      STATUS_STYLE[selected.status].fill,
                    )}
                  />
                  {STATUS_STYLE[selected.status].label}
                </span>
                <span className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent">
                  {selected.seats} seats
                </span>
                {selected.section ? (
                  <span className="rounded-full bg-line/60 px-2.5 py-1 text-xs font-medium text-muted">
                    {selected.section}
                  </span>
                ) : null}
              </div>

              {selected.orders[0] ? (
                <div className="rounded-xl border border-line bg-background p-3">
                  <p className="text-xs text-muted">Open ticket</p>
                  <p className="font-semibold">
                    {selected.orders[0].orderNumber}
                  </p>
                  <p className="text-sm text-muted">
                    {formatMoney(selected.orders[0].totalCents)} ·{" "}
                    {selected.orders[0].guestCount} guests
                  </p>
                  <Link
                    href={`/orders/${selected.orders[0].id}`}
                    className="mt-2 inline-block text-xs font-semibold text-accent hover:underline"
                  >
                    View order →
                  </Link>
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-line px-3 py-4 text-sm text-muted">
                  No open ticket on this table.
                </p>
              )}

              {canEdit ? (
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Set status
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={pending || selected.status === status}
                        onClick={() => setStatus(status)}
                        className={cn(
                          "rounded-lg px-2 py-2 text-[11px] font-semibold ring-1 transition disabled:opacity-40",
                          selected.status === status
                            ? "bg-accent text-white ring-accent"
                            : "bg-background text-foreground ring-line hover:bg-accent-soft",
                        )}
                      >
                        {STATUS_STYLE[status].label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <Link
                href={`/tables/${selected.id}`}
                className="inline-flex text-sm font-semibold text-accent hover:underline"
              >
                Edit table details →
              </Link>
            </div>
          ) : (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
              <Move className="mb-3 h-8 w-8 text-muted/40" />
              <p className="text-sm font-medium text-foreground">
                Select a cloud table
              </p>
              <p className="mt-1 max-w-[200px] text-xs text-muted">
                Click a table for details
                {canEdit ? ", or drag to rearrange the floor." : "."}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
