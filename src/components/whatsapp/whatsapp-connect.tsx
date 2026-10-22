"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  PlugZap,
  Shield,
  Unplug,
  Wifi,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActionState } from "@/lib/actions/auth";
import {
  completeWhatsAppEmbeddedSignupAction,
  connectWhatsAppManualAction,
  disconnectWhatsAppAction,
  verifyWhatsAppConnectionAction,
} from "@/lib/actions/whatsapp";
import { cn } from "@/lib/utils";
import type { WhatsAppConnectionStatus } from "@/generated/prisma/client";

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void;
      login: (
        cb: (response: {
          authResponse?: { code?: string };
          status?: string;
        }) => void,
        opts: Record<string, unknown>,
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

type MetaPublicConfig = {
  appId: string;
  configId: string;
  graphVersion: string;
  embeddedSignupReady: boolean;
};

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

function loadFacebookSdk(appId: string, graphVersion: string) {
  return new Promise<void>((resolve, reject) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = () => {
      window.FB?.init({
        appId,
        autoLogAppEvents: true,
        xfbml: true,
        version: graphVersion,
      });
      resolve();
    };

    const existing = document.getElementById("facebook-jssdk");
    if (existing) {
      // Script tag exists but FB may still be loading
      const started = Date.now();
      const timer = window.setInterval(() => {
        if (window.FB) {
          window.clearInterval(timer);
          resolve();
        } else if (Date.now() - started > 12000) {
          window.clearInterval(timer);
          reject(new Error("Facebook SDK timed out."));
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.async = true;
    script.defer = true;
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.onerror = () => reject(new Error("Failed to load Facebook SDK."));
    document.body.appendChild(script);
  });
}

function formatWhen(value: Date | string | null) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function WhatsAppConnectPanel({
  canManage,
  connection,
  meta,
  webhookUrl,
  verifyTokenConfigured,
}: {
  canManage: boolean;
  connection: ConnectionView;
  meta: MetaPublicConfig;
  webhookUrl: string;
  verifyTokenConfigured: boolean;
}) {
  const [manualOpen, setManualOpen] = useState(
    !meta.embeddedSignupReady || connection.status === "ERROR",
  );
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pending, startTransition] = useTransition();
  const sessionRef = useRef<{
    phoneNumberId?: string;
    wabaId?: string;
    businessId?: string;
  }>({});

  const [manualState, manualAction, manualPending] = useActionState(
    connectWhatsAppManualAction,
    {} as ActionState,
  );

  useEffect(() => {
    if (manualState.success) toast.success(manualState.success);
    if (manualState.error) toast.error(manualState.error);
  }, [manualState]);

  useEffect(() => {
    if (!meta.embeddedSignupReady || !canManage) return;
    let cancelled = false;
    loadFacebookSdk(meta.appId, meta.graphVersion)
      .then(() => {
        if (!cancelled) {
          setSdkReady(true);
          setSdkError(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSdkError(
            error instanceof Error ? error.message : "SDK failed to load",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [meta.appId, meta.graphVersion, meta.embeddedSignupReady, canManage]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }
      try {
        const data =
          typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        const payload = data.data ?? data;
        if (payload?.phone_number_id) {
          sessionRef.current.phoneNumberId = String(payload.phone_number_id);
        }
        if (payload?.waba_id) {
          sessionRef.current.wabaId = String(payload.waba_id);
        }
        if (payload?.business_id) {
          sessionRef.current.businessId = String(payload.business_id);
        }
      } catch {
        // ignore non-JSON messages from other frames
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const finishEmbedded = useCallback(async (code: string) => {
    setConnecting(true);
    try {
      // Session info postMessage can arrive slightly after FB.login callback
      for (let i = 0; i < 10; i += 1) {
        if (
          sessionRef.current.phoneNumberId &&
          sessionRef.current.wabaId
        ) {
          break;
        }
        await new Promise((r) => window.setTimeout(r, 200));
      }

      const phoneNumberId = sessionRef.current.phoneNumberId;
      const wabaId = sessionRef.current.wabaId;
      if (!phoneNumberId || !wabaId) {
        toast.error(
          "Meta signup finished, but phone/WABA ids were missing. Try again or use Manual connect.",
        );
        return;
      }

      const result = await completeWhatsAppEmbeddedSignupAction({
        code,
        phoneNumberId,
        wabaId,
        businessId: sessionRef.current.businessId ?? null,
      });
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    } finally {
      setConnecting(false);
    }
  }, []);

  function launchEmbeddedSignup() {
    if (!window.FB) {
      toast.error("Facebook SDK is not ready yet.");
      return;
    }
    setConnecting(true);
    sessionRef.current = {};
    window.FB.login(
      (response) => {
        const code = response.authResponse?.code;
        if (!code) {
          setConnecting(false);
          if (response.status !== "connected") {
            toast.message("WhatsApp signup was cancelled.");
          } else {
            toast.error("No authorization code returned from Meta.");
          }
          return;
        }
        void finishEmbedded(code);
      },
      {
        config_id: meta.configId,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      },
    );
  }

  function copyWebhook() {
    if (!webhookUrl) {
      toast.error(
        "Set WHATSAPP_PUBLIC_URL (ngrok/domain) so the webhook URL can be generated.",
      );
      return;
    }
    void navigator.clipboard.writeText(webhookUrl);
    toast.success("Webhook URL copied");
  }

  function runVerify() {
    startTransition(async () => {
      const result = await verifyWhatsAppConnectionAction();
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  }

  function runDisconnect() {
    if (!window.confirm("Disconnect this WhatsApp Business number?")) return;
    startTransition(async () => {
      const result = await disconnectWhatsAppAction();
      if (result.error) toast.error(result.error);
      if (result.success) toast.success(result.success);
    });
  }

  const connected = connection.status === "CONNECTED";
  const busy = connecting || pending || manualPending;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2]/15 text-[#1877F2]">
            <PlugZap className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Connect Meta WhatsApp
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Link your official Business number. Tokens are encrypted at rest.
            </p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
            connected
              ? "bg-[#25D366]/15 text-[#128C7E]"
              : "bg-line text-muted",
          )}
        >
          {connected ? "Live" : connection.status}
        </span>
      </div>

      {connected ? (
        <div className="mb-4 space-y-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#128C7E]" />
            <div className="text-sm">
              <p className="font-semibold text-foreground">
                {connection.verifiedName ?? "WhatsApp Business"}
              </p>
              <p className="text-muted">
                {connection.displayPhoneNumber ?? "Number linked"}
              </p>
            </div>
          </div>
          <dl className="grid gap-2 text-xs text-muted sm:grid-cols-2">
            <div>
              <dt className="font-medium text-foreground">Phone number ID</dt>
              <dd className="font-mono">{connection.phoneNumberId ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">WABA ID</dt>
              <dd className="font-mono">{connection.wabaId ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Connected</dt>
              <dd>{formatWhen(connection.connectedAt)}</dd>
            </div>
            <div>
              <dt className="font-medium text-foreground">Last webhook</dt>
              <dd>{formatWhen(connection.lastWebhookAt)}</dd>
            </div>
          </dl>
          {canManage ? (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={runVerify}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Wifi className="h-3.5 w-3.5" />
                )}
                Test connection
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={runDisconnect}
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {connection.lastError ? (
        <p className="mb-4 rounded-xl border border-danger/20 bg-danger/5 px-3 py-2 text-sm text-danger">
          {connection.lastError}
        </p>
      ) : null}

      {/* Webhook checklist */}
      <div className="mb-4 rounded-xl border border-line bg-background/70 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
          Meta App webhook (one-time platform setup)
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-line/60 px-3 py-2 text-xs">
            {webhookUrl ||
              "Set WHATSAPP_PUBLIC_URL in .env → https://your-domain/api/whatsapp/webhook"}
          </code>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={copyWebhook}
            disabled={!webhookUrl}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
        <ul className="mt-3 space-y-1 text-xs leading-5 text-muted">
          <li>
            · Callback URL → paste above in Meta App → WhatsApp → Configuration
          </li>
          <li>
            · Verify token →{" "}
            {verifyTokenConfigured ? (
              <span className="font-medium text-accent">configured in env</span>
            ) : (
              <span className="font-medium text-danger">
                set META_WHATSAPP_VERIFY_TOKEN
              </span>
            )}
          </li>
          <li>· Subscribe to fields: messages, message_template_status_update</li>
        </ul>
      </div>

      {canManage && !connected ? (
        <div className="space-y-4">
          {meta.embeddedSignupReady ? (
            <div className="rounded-xl border border-line p-4">
              <p className="text-sm font-semibold text-foreground">
                Option A — One-click Embedded Signup
              </p>
              <p className="mt-1 text-sm text-muted">
                Meta opens a secure popup. Pick/create your Business WhatsApp
                number — we store encrypted tokens automatically.
              </p>
              {sdkError ? (
                <p className="mt-2 text-sm text-danger">{sdkError}</p>
              ) : null}
              <Button
                className="mt-3 bg-[#1877F2] hover:bg-[#166fe5]"
                disabled={busy || !sdkReady}
                onClick={launchEmbeddedSignup}
              >
                {connecting || !sdkReady ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                {!sdkReady && !sdkError
                  ? "Loading Meta…"
                  : connecting
                    ? "Connecting…"
                    : "Connect with Meta"}
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line bg-background/50 px-4 py-3 text-sm text-muted">
              Embedded Signup needs{" "}
              <code className="text-xs">NEXT_PUBLIC_META_APP_ID</code>,{" "}
              <code className="text-xs">META_APP_SECRET</code>, and{" "}
              <code className="text-xs">
                NEXT_PUBLIC_META_EMBEDDED_SIGNUP_CONFIG_ID
              </code>
              . Until then, use Manual Cloud API below.
            </div>
          )}

          <div>
            <button
              type="button"
              className="text-sm font-semibold text-accent hover:underline"
              onClick={() => setManualOpen((v) => !v)}
            >
              {manualOpen ? "Hide" : "Show"} Option B — Manual Cloud API
            </button>
            {manualOpen ? (
              <form action={manualAction} className="mt-3 space-y-3">
                <p className="text-xs leading-5 text-muted">
                  Paste credentials from Meta Developer → WhatsApp → API Setup.
                  Best for testing before Embedded Signup is fully approved.
                </p>
                <Input
                  name="displayPhoneNumber"
                  label="Display phone (optional)"
                  placeholder="+923001234567"
                  defaultValue={connection.displayPhoneNumber ?? ""}
                />
                <Input
                  name="phoneNumberId"
                  label="Phone number ID"
                  placeholder="e.g. 109876543210"
                  required
                  defaultValue={connection.phoneNumberId ?? ""}
                />
                <Input
                  name="wabaId"
                  label="WhatsApp Business Account ID"
                  placeholder="e.g. 102345678901"
                  required
                  defaultValue={connection.wabaId ?? ""}
                />
                <Input
                  name="businessId"
                  label="Meta Business ID (optional)"
                  placeholder="Optional"
                />
                <Input
                  name="accessToken"
                  label="Permanent access token"
                  type="password"
                  autoComplete="off"
                  placeholder="EAAG…"
                  required
                />
                <div className="flex items-start gap-2 rounded-lg bg-accent-soft/40 px-3 py-2 text-xs text-muted">
                  <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                  Token is AES-256-GCM encrypted before storage. Never returned
                  to the browser.
                </div>
                <Button type="submit" disabled={busy} className="w-full">
                  {manualPending ? "Connecting…" : "Connect Cloud API"}
                </Button>
              </form>
            ) : null}
          </div>
        </div>
      ) : null}

      {!canManage ? (
        <p className="text-sm text-muted">
          Only OWNER or ADMIN can connect or disconnect WhatsApp.
        </p>
      ) : null}
    </section>
  );
}
