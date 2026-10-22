"use client";

import { useActionState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import {
  Bot,
  MessageSquare,
  Phone,
  Power,
  Pause,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import type { ActionState } from "@/lib/actions/auth";
import {
  saveWhatsAppDisplayPhoneAction,
  setWhatsAppBotModeAction,
  updateWhatsAppChatbotAction,
} from "@/lib/actions/whatsapp";
import { WhatsAppConnectPanel } from "@/components/whatsapp/whatsapp-connect";
import { WhatsAppAiPanel } from "@/components/whatsapp/whatsapp-ai-panel";
import { cn } from "@/lib/utils";
import type {
  WhatsAppBotMode,
  WhatsAppConnectionStatus,
} from "@/generated/prisma/client";

type ConnectionView = {
  status: WhatsAppConnectionStatus;
  displayPhoneNumber: string | null;
  verifiedName: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  hasAccessToken: boolean;
  connectedAt: Date | string | null;
  lastWebhookAt: Date | string | null;
  lastError: string | null;
};

type MetaPublicConfig = {
  appId: string;
  configId: string;
  graphVersion: string;
  embeddedSignupReady: boolean;
};

type ChatbotView = {
  mode: WhatsAppBotMode;
  displayName: string;
  greetingMessage: string;
  fallbackMessage: string;
  language: string;
  tone: string;
  canBrowseMenu: boolean;
  canTakeOrders: boolean;
  canTrackOrders: boolean;
  canAnswerFaq: boolean;
  allowDelivery: boolean;
  allowTakeaway: boolean;
  allowDineIn: boolean;
  businessHoursEnabled: boolean;
  offlineMessage: string | null;
  humanHandoffEnabled: boolean;
  handoffKeywords: string[];
  systemPromptExtra: string | null;
  maxReplyTokens: number;
};

const STATUS_LABEL: Record<WhatsAppConnectionStatus, string> = {
  DISCONNECTED: "Not connected",
  PENDING: "Number saved — connect Meta next",
  CONNECTED: "Connected",
  ERROR: "Connection error",
  REVOKED: "Access revoked",
};

function ToggleCard({
  name,
  title,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-background/70 px-4 py-3 transition hover:border-accent/40",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="checkbox"
        name={name}
        value="on"
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 accent-[#128C7E]"
      />
      <span>
        <span className="block text-sm font-semibold text-foreground">
          {title}
        </span>
        <span className="text-xs leading-5 text-muted">{description}</span>
      </span>
    </label>
  );
}

export function WhatsAppSetup({
  canManage,
  connection,
  chatbot,
  stats,
  meta,
  webhookUrl,
  verifyTokenConfigured,
  ai,
}: {
  canManage: boolean;
  connection: ConnectionView;
  chatbot: ChatbotView;
  stats: { conversationCount: number; openConversations: number };
  meta: MetaPublicConfig;
  webhookUrl: string;
  verifyTokenConfigured: boolean;
  ai: {
    configured: boolean;
    model: string;
    provider: string;
  };
}) {
  const [phoneState, phoneAction, phonePending] = useActionState(
    saveWhatsAppDisplayPhoneAction,
    {} as ActionState,
  );
  const [configState, configAction, configPending] = useActionState(
    updateWhatsAppChatbotAction,
    {} as ActionState,
  );
  const [modePending, startMode] = useTransition();

  useEffect(() => {
    if (phoneState.success) toast.success(phoneState.success);
    if (phoneState.error) toast.error(phoneState.error);
  }, [phoneState]);

  useEffect(() => {
    if (configState.success) toast.success(configState.success);
    if (configState.error) toast.error(configState.error);
  }, [configState]);

  function changeMode(mode: WhatsAppBotMode) {
    startMode(async () => {
      const result = await setWhatsAppBotModeAction(mode);
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  }

  const connected = connection.status === "CONNECTED";
  const busy = phonePending || configPending || modePending;

  return (
    <div className="space-y-6">
      {/* Hero status */}
      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
        <div className="bg-gradient-to-r from-[#25D366]/15 via-surface to-[#128C7E]/10 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/20 text-[#128C7E]">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {chatbot.displayName}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {STATUS_LABEL[connection.status]}
                  {connection.displayPhoneNumber
                    ? ` · ${connection.displayPhoneNumber}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-background/80 px-2.5 py-1 font-medium text-muted">
                    Mode: {chatbot.mode}
                  </span>
                  <span className="rounded-full bg-background/80 px-2.5 py-1 font-medium text-muted">
                    {stats.openConversations} open chats
                  </span>
                  <span className="rounded-full bg-background/80 px-2.5 py-1 font-medium text-muted">
                    {stats.conversationCount} total
                  </span>
                </div>
              </div>
            </div>

            {canManage ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={chatbot.mode === "ACTIVE" ? "primary" : "secondary"}
                  disabled={busy}
                  onClick={() => changeMode("ACTIVE")}
                  className={
                    chatbot.mode === "ACTIVE"
                      ? "bg-[#128C7E] hover:bg-[#0f7a6c]"
                      : undefined
                  }
                >
                  <Power className="h-4 w-4" />
                  Activate
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy || chatbot.mode === "OFF"}
                  onClick={() => changeMode("PAUSED")}
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy || chatbot.mode === "OFF"}
                  onClick={() => changeMode("OFF")}
                >
                  Turn off
                </Button>
              </div>
            ) : null}
          </div>
          {!connected ? (
            <p className="mt-4 rounded-xl border border-dashed border-line bg-background/60 px-4 py-3 text-sm text-muted">
              Connect Meta below first, then Activate. You can still tune the AI
              personality anytime.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-[#25D366]/25 bg-[#25D366]/5 px-4 py-3 text-sm text-[#0f6b4c]">
              Number connected. Hit Activate when you want the AI to reply on
              WhatsApp.
            </p>
          )}
          {connection.lastError ? (
            <p className="mt-3 text-sm text-danger">{connection.lastError}</p>
          ) : null}
        </div>
      </div>

      <WhatsAppAiPanel
        canManage={canManage}
        configured={ai.configured}
        model={ai.model}
        provider={ai.provider}
        botMode={chatbot.mode}
        connectionStatus={connection.status}
      />

      <WhatsAppConnectPanel
        canManage={canManage}
        connection={connection}
        meta={meta}
        webhookUrl={webhookUrl}
        verifyTokenConfigured={verifyTokenConfigured}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Number */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-[#128C7E]" />
            <h2 className="text-sm font-semibold text-foreground">
              Display number (optional)
            </h2>
          </div>
          <p className="mb-4 text-sm leading-6 text-muted">
            Optional label before Meta connect. After connect, Meta’s verified
            display number is used automatically.
          </p>
          {canManage ? (
            <form action={phoneAction} className="space-y-3">
              <Input
                name="displayPhoneNumber"
                label="WhatsApp number"
                placeholder="+923001234567"
                defaultValue={connection.displayPhoneNumber ?? ""}
                required
              />
              <Button type="submit" disabled={phonePending} className="w-full">
                {phonePending ? "Saving…" : "Save number"}
              </Button>
            </form>
          ) : (
            <p className="text-sm font-medium">
              {connection.displayPhoneNumber ?? "Not set"}
            </p>
          )}
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-accent-soft/50 px-3 py-2.5 text-xs leading-5 text-muted">
            <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            Access tokens are AES-256-GCM encrypted. Never shown in plaintext.
          </div>
        </section>

        {/* Personality */}
        <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm lg:col-span-3">
          <div className="mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">
              Chatbot personality
            </h2>
          </div>

          {canManage ? (
            <form action={configAction} className="space-y-5" id="whatsapp-config">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  name="displayName"
                  label="Assistant name"
                  defaultValue={chatbot.displayName}
                  required
                />
                <Select
                  name="language"
                  label="Language"
                  defaultValue={chatbot.language}
                  options={[
                    { value: "en", label: "English" },
                    { value: "ur", label: "Urdu" },
                    { value: "ar", label: "Arabic" },
                    { value: "hi", label: "Hindi" },
                    { value: "es", label: "Spanish" },
                    { value: "fr", label: "French" },
                  ]}
                />
                <Select
                  name="tone"
                  label="Tone"
                  defaultValue={chatbot.tone}
                  options={[
                    { value: "friendly", label: "Friendly" },
                    { value: "professional", label: "Professional" },
                    { value: "casual", label: "Casual" },
                  ]}
                />
                <Input
                  name="maxReplyTokens"
                  label="Max reply length"
                  type="number"
                  min={200}
                  max={2000}
                  defaultValue={String(chatbot.maxReplyTokens)}
                />
              </div>

              <Textarea
                name="greetingMessage"
                label="Greeting message"
                defaultValue={chatbot.greetingMessage}
                required
              />
              <Textarea
                name="fallbackMessage"
                label="When AI is unsure"
                defaultValue={chatbot.fallbackMessage}
                required
              />

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  What the AI can do
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <ToggleCard
                    name="canBrowseMenu"
                    title="Browse menu & deals"
                    description="Answer questions from live menu data"
                    defaultChecked={chatbot.canBrowseMenu}
                  />
                  <ToggleCard
                    name="canTakeOrders"
                    title="Take orders"
                    description="Create real orders into kitchen/POS"
                    defaultChecked={chatbot.canTakeOrders}
                  />
                  <ToggleCard
                    name="canTrackOrders"
                    title="Track orders"
                    description="Share status for recent orders"
                    defaultChecked={chatbot.canTrackOrders}
                  />
                  <ToggleCard
                    name="canAnswerFaq"
                    title="Answer FAQs"
                    description="Hours, location-style questions"
                    defaultChecked={chatbot.canAnswerFaq}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Order types allowed
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  <ToggleCard
                    name="allowTakeaway"
                    title="Takeaway"
                    description="Pickup orders"
                    defaultChecked={chatbot.allowTakeaway}
                  />
                  <ToggleCard
                    name="allowDelivery"
                    title="Delivery"
                    description="Needs customer address"
                    defaultChecked={chatbot.allowDelivery}
                  />
                  <ToggleCard
                    name="allowDineIn"
                    title="Dine-in"
                    description="Optional table booking style"
                    defaultChecked={chatbot.allowDineIn}
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Human handoff
                </p>
                <div className="space-y-3">
                  <ToggleCard
                    name="humanHandoffEnabled"
                    title="Allow handoff to staff"
                    description="Customer can ask for a human agent"
                    defaultChecked={chatbot.humanHandoffEnabled}
                  />
                  <Input
                    name="handoffKeywords"
                    label="Handoff keywords"
                    defaultValue={chatbot.handoffKeywords.join(", ")}
                    placeholder="agent, human, staff, help"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-foreground">
                  Business hours
                </p>
                <div className="space-y-3">
                  <ToggleCard
                    name="businessHoursEnabled"
                    title="Respect business hours"
                    description="Send offline message outside hours (hours editor in a later step)"
                    defaultChecked={chatbot.businessHoursEnabled}
                  />
                  <Textarea
                    name="offlineMessage"
                    label="Offline message"
                    defaultValue={chatbot.offlineMessage ?? ""}
                    placeholder="We're closed right now. We'll reply when we open."
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <p className="text-sm font-medium text-foreground">
                    AI training instructions
                  </p>
                </div>
                <p className="mb-2 text-xs text-muted">
                  Teach the bot how to behave (tone, upsells, rules). Combined
                  with live menu data + chat history so it understands each
                  customer message.
                </p>
                <Textarea
                  name="systemPromptExtra"
                  defaultValue={chatbot.systemPromptExtra ?? ""}
                  placeholder="e.g. Always recommend today's deal. Ask for spicy level on wings. Never invent menu items. Keep replies under 4 lines."
                />
              </div>

              <Button type="submit" disabled={configPending} className="w-full sm:w-auto">
                {configPending ? "Saving…" : "Save chatbot settings"}
              </Button>
            </form>
          ) : (
            <p className="text-sm text-muted">
              View only — ask an OWNER or ADMIN to edit chatbot settings.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
