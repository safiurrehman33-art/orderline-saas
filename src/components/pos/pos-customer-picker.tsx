"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  MapPin,
  Plus,
  Search,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  createPosCustomerAction,
  type PosCustomerActionState,
  type PosCustomerCreated,
} from "@/lib/actions/customers";

export type PosCustomer = PosCustomerCreated;

function formatAddress(customer: PosCustomer) {
  return [
    customer.addressLine1,
    customer.addressLine2,
    [customer.city, customer.state, customer.postalCode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .join(" · ");
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

const fieldClass =
  "h-10 w-full rounded-xl border border-white/10 bg-[#0b1220] px-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#e11d48] focus:ring-2 focus:ring-[#e11d48]/20";

function PosField({
  label,
  name,
  error,
  required,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  error?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-white/60">
        {label}
        {required ? <span className="text-[#fb7185]"> *</span> : null}
      </span>
      <input name={name} required={required} className={fieldClass} {...props} />
      {error ? <span className="text-xs text-[#fb7185]">{error}</span> : null}
    </label>
  );
}

function AddCustomerModal({
  open,
  onClose,
  onCreated,
  requireAddress,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (customer: PosCustomer) => void;
  requireAddress: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    createPosCustomerAction,
    {} as PosCustomerActionState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    if (state.success && state.customer) {
      toast.success(state.success);
      onCreated(state.customer);
      formRef.current?.reset();
      onClose();
    }
    if (state.error) toast.error(state.error);
  }, [state, open, onCreated, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-add-customer-title"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/50 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e11d48]/15 text-[#fb7185]">
              <UserPlus className="h-5 w-5" />
            </span>
            <div>
              <h2
                id="pos-add-customer-title"
                className="text-base font-semibold text-white"
              >
                New customer
              </h2>
              <p className="text-xs text-white/45">
                Saved to your customer list and selected on this ticket
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          ref={formRef}
          action={formAction}
          className="scroll-dark min-h-0 flex-1 overflow-y-auto px-5 py-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <PosField
              name="name"
              label="Full name"
              required
              placeholder="Jane Customer"
              autoFocus
              className="sm:col-span-2"
              error={state.fieldErrors?.name?.[0]}
            />
            <PosField
              name="phone"
              label="Phone"
              placeholder="+1 555 0100"
              error={state.fieldErrors?.phone?.[0]}
            />
            <PosField
              name="email"
              type="email"
              label="Email"
              placeholder="jane@email.com"
              error={state.fieldErrors?.email?.[0]}
            />
            <PosField
              name="addressLine1"
              label="Address"
              required={requireAddress}
              placeholder="Street address"
              className="sm:col-span-2"
              error={state.fieldErrors?.addressLine1?.[0]}
            />
            <PosField
              name="addressLine2"
              label="Apt / suite"
              placeholder="Optional"
              className="sm:col-span-2"
            />
            <PosField name="city" label="City" placeholder="City" />
            <PosField name="state" label="State" placeholder="State" />
            <PosField
              name="postalCode"
              label="Postal code"
              placeholder="ZIP"
            />
            <PosField
              name="country"
              label="Country"
              defaultValue="US"
              placeholder="US"
            />
          </div>

          <div className="mt-5 flex gap-2 border-t border-white/10 pt-4 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-11 flex-[1.4] rounded-xl bg-[#e11d48] text-sm font-semibold text-white hover:bg-[#be123c] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save & select"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PosCustomerPicker({
  customers,
  value,
  onChange,
  onCustomersChange,
  required,
}: {
  customers: PosCustomer[];
  value: string;
  onChange: (id: string) => void;
  onCustomersChange: (customers: PosCustomer[]) => void;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  function openAddModal() {
    setOpen(false);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  const selected = useMemo(
    () => customers.find((c) => c.id === value) ?? null,
    [customers, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.addressLine1?.toLowerCase().includes(q),
    );
  }, [customers, query]);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleCreated(customer: PosCustomer) {
    onCustomersChange([customer, ...customers.filter((c) => c.id !== customer.id)]);
    onChange(customer.id);
  }

  const address = selected ? formatAddress(selected) : "";

  return (
    <div ref={rootRef} className="relative">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Customer
          {required ? <span className="text-[#fb7185]"> *</span> : null}
        </label>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#fb7185] hover:text-[#fda4af]"
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center gap-3 rounded-xl border px-3 text-left transition",
          open
            ? "border-[#e11d48] bg-white/10 ring-2 ring-[#e11d48]/25"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            selected
              ? "bg-[#e11d48]/20 text-[#fb7185]"
              : "bg-white/10 text-white/45",
          )}
        >
          {selected ? initials(selected.name) : <User className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">
            {selected
              ? selected.name
              : required
                ? "Select customer…"
                : "Walk-in (no customer)"}
          </span>
          <span className="block truncate text-[11px] text-white/45">
            {selected
              ? selected.phone || selected.email || "No contact on file"
              : "Guest checkout"}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/40 transition",
            open && "rotate-180",
          )}
        />
      </button>

      {selected && address ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-white/50">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[#fb7185]" />
          <span>{address}</span>
        </p>
      ) : selected && required ? (
        <p className="mt-1.5 text-xs text-amber-300/80">
          No address on file — edit under Customers or add a new one.
        </p>
      ) : null}

      {open ? (
        <div className="absolute bottom-full left-0 z-40 mb-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/50">
          <div className="border-b border-white/10 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, phone, address…"
                autoFocus
                className="h-10 w-full rounded-xl border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#e11d48]"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="flex w-full items-center gap-3 border-b border-white/10 px-3 py-3 text-left transition hover:bg-[#e11d48]/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e11d48] text-white">
              <Plus className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#fb7185]">
                Add customer
              </span>
              <span className="block text-[11px] text-white/45">
                Create and select on this order
              </span>
            </span>
          </button>

          <div className="scroll-dark max-h-56 overflow-y-auto py-1">
            {!required ? (
              <button
                type="button"
                onClick={() => select("")}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5",
                  !value && "bg-white/5",
                )}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/45">
                  <User className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">
                    Walk-in
                  </span>
                  <span className="block text-[11px] text-white/45">
                    No customer on ticket
                  </span>
                </span>
                {!value ? <Check className="h-4 w-4 text-[#fb7185]" /> : null}
              </button>
            ) : null}

            {filtered.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-white/40">
                No matches. Try Add customer.
              </p>
            ) : (
              filtered.map((customer) => {
                const active = customer.id === value;
                return (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => select(customer.id)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/5",
                      active && "bg-[#e11d48]/10",
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white/80">
                      {initials(customer.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">
                        {customer.name}
                      </span>
                      <span className="block truncate text-[11px] text-white/45">
                        {[customer.phone, formatAddress(customer)]
                          .filter(Boolean)
                          .join(" · ") || "No details"}
                      </span>
                    </span>
                    {active ? (
                      <Check className="h-4 w-4 shrink-0 text-[#fb7185]" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {modalOpen ? (
        <AddCustomerModal
          key={modalKey}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={handleCreated}
          requireAddress={Boolean(required)}
        />
      ) : null}
    </div>
  );
}
