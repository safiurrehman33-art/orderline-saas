import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const PREFIX = "ol1"; // OrderLine secret format v1

function getEncryptionKey() {
  const raw =
    process.env.WHATSAPP_ENCRYPTION_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!raw) {
    throw new Error(
      "Set WHATSAPP_ENCRYPTION_KEY (preferred) or AUTH_SECRET to encrypt WhatsApp tokens.",
    );
  }

  // Stable 32-byte key from any length secret
  return createHash("sha256").update(`orderline:whatsapp:${raw}`).digest();
}

/** Encrypt a secret for DB storage (AES-256-GCM). */
export function encryptSecret(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

/** Decrypt a value produced by encryptSecret. */
export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error("Invalid encrypted secret format.");
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = getEncryptionKey();
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(ivB64, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64url")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateWebhookVerifyToken(): string {
  return randomBytes(24).toString("base64url");
}

export function maskSecret(value: string | null | undefined, visible = 4): string {
  if (!value) return "—";
  if (value.length <= visible) return "••••";
  return `${"•".repeat(Math.min(12, value.length - visible))}${value.slice(-visible)}`;
}
