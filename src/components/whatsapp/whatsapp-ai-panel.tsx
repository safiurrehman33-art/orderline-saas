"use client";

import { Bot, Brain, CheckCircle2, TriangleAlert } from "lucide-react";
import type {
  WhatsAppBotMode,
  WhatsAppConnectionStatus,
} from "@/generated/prisma/client";

export function WhatsAppAiPanel({
  canManage,
  configured,
  model,
  provider,
  botMode,
  connectionStatus,
}: {
  canManage: boolean;
  configured: boolean;
  model: string;
  provider: string;
  botMode: WhatsAppBotMode;
  connectionStatus: WhatsAppConnectionStatus;
}) {
  const liveReady =
    configured &&
    connectionStatus === "CONNECTED" &&
    botMode === "ACTIVE";

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Brain className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Real-time AI brain
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Customer WhatsApp messages hit your webhook → AI reads live menu /
              deals → replies on the same chat. Train behavior with Extra AI
              instructions below.
            </p>
          </div>
        </div>
        <span
          className={
            liveReady
              ? "rounded-full bg-[#25D366]/15 px-3 py-1 text-xs font-semibold text-[#128C7E]"
              : "rounded-full bg-line px-3 py-1 text-xs font-semibold text-muted"
          }
        >
          {liveReady ? "Live path ready" : "Not fully live yet"}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-background/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            AI provider
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {configured ? (
              <CheckCircle2 className="h-4 w-4 text-accent" />
            ) : (
              <TriangleAlert className="h-4 w-4 text-danger" />
            )}
            {configured ? provider : "Not configured"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {configured ? `Model: ${model}` : "Add OPENAI_API_KEY in .env"}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-background/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            WhatsApp number
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {connectionStatus === "CONNECTED" ? "Connected" : connectionStatus}
          </p>
          <p className="mt-1 text-xs text-muted">
            Real Meta Cloud API (no simulator)
          </p>
        </div>
        <div className="rounded-xl border border-line bg-background/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            Bot mode
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-accent" />
            {botMode}
          </p>
          <p className="mt-1 text-xs text-muted">
            Activate after number + AI key are ready
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="mt-4 rounded-xl border border-dashed border-danger/30 bg-danger/5 px-4 py-3 text-sm text-muted">
          <p className="font-medium text-foreground">Setup OpenAI for smart replies</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm leading-6">
            <li>
              Add to <code className="text-xs">.env</code>:{" "}
              <code className="text-xs">OPENAI_API_KEY=sk-...</code>
            </li>
            <li>
              Optional:{" "}
              <code className="text-xs">OPENAI_MODEL=gpt-4o-mini</code>
            </li>
            <li>Restart <code className="text-xs">npm run dev</code></li>
            <li>Connect WhatsApp number → Activate bot</li>
          </ol>
          {!canManage ? (
            <p className="mt-2 text-xs">Ask an OWNER/ADMIN to configure this.</p>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Flow: customer messages your business WhatsApp → Meta webhook → OpenAI
          agent with tools (menu, cart, order, track) → reply sent back on
          WhatsApp.
        </p>
      )}
    </section>
  );
}
