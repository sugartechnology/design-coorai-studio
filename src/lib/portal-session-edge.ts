/**
 * Edge-safe read of `forcePasswordChange` from the signed portal session cookie.
 * Middleware cannot import `portal-session.ts` (`server-only` + Node `crypto`).
 * Signature check matches `encodePortalSession` (HMAC-SHA256, base64url).
 */

function bytesToBase64Url(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function signaturesMatch(expected: string, actual: string): boolean {
  if (expected.length !== actual.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ actual.charCodeAt(i);
  }
  return diff === 0;
}

export async function readForcePasswordChange(
  raw: string | undefined | null,
): Promise<boolean> {
  const secret = process.env.PORTAL_SESSION_SECRET;
  if (!raw || !secret || secret.length < 16) return false;

  const dot = raw.indexOf(".");
  if (dot <= 0 || dot === raw.length - 1) return false;
  const payload = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(payload),
    );
    if (!signaturesMatch(bytesToBase64Url(mac), signature)) return false;

    const jsonBytes = base64UrlToBytes(payload);
    if (!jsonBytes) return false;
    const data = JSON.parse(new TextDecoder().decode(jsonBytes)) as {
      forcePasswordChange?: unknown;
    };
    return data.forcePasswordChange === true;
  } catch {
    return false;
  }
}
