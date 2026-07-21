"use client";

import { portalCrmFetch } from "@/lib/portal-crm";
import type {
  AiImageContext,
  AiImageGeneration,
  AiStudioCreditQuote,
  AiStudioRoomDesignRequest,
  AiStudioRoomReferenceRequest,
} from "./types";

type RouterLike = { replace: (href: string) => void };

export function createAiStudioSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function getOrCreateAiStudioSessionId(companyId: string): string {
  const key = `ai-studio:portal:${companyId}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const created = createAiStudioSessionId();
    sessionStorage.setItem(key, created);
    return created;
  } catch {
    return createAiStudioSessionId();
  }
}

export async function generateRoomReference(
  sessionId: string,
  body: AiStudioRoomReferenceRequest,
  router?: RouterLike,
): Promise<AiImageGeneration> {
  return portalCrmFetch<AiImageGeneration>(
    `ai-studio/room-design/${encodeURIComponent(sessionId)}/generate-reference`,
    { method: "POST", body, router },
  );
}

export async function generateRoomDesign(
  sessionId: string,
  body: AiStudioRoomDesignRequest,
  router?: RouterLike,
): Promise<AiImageGeneration> {
  return portalCrmFetch<AiImageGeneration>(
    `ai-studio/room-design/${encodeURIComponent(sessionId)}/generate`,
    { method: "POST", body, router },
  );
}

export async function listRoomGenerations(
  sessionId: string,
  statuses?: string[],
  router?: RouterLike,
): Promise<AiImageGeneration[]> {
  const params = new URLSearchParams();
  for (const status of statuses ?? []) params.append("statuses", status);
  const qs = params.toString();
  return portalCrmFetch<AiImageGeneration[]>(
    `ai-studio/room-design/${encodeURIComponent(sessionId)}/generations${qs ? `?${qs}` : ""}`,
    { router },
  );
}

export async function listReferenceGenerations(
  sessionId: string,
  statuses?: string[],
  router?: RouterLike,
): Promise<AiImageGeneration[]> {
  const params = new URLSearchParams();
  for (const status of statuses ?? []) params.append("statuses", status);
  const qs = params.toString();
  return portalCrmFetch<AiImageGeneration[]>(
    `ai-studio/room-design/${encodeURIComponent(sessionId)}/reference-generations${qs ? `?${qs}` : ""}`,
    { router },
  );
}

export async function quoteAiCredits(
  contextType: AiImageContext,
  options: { imageSize?: string; aspectRatio?: string; router?: RouterLike } = {},
): Promise<AiStudioCreditQuote> {
  return portalCrmFetch<AiStudioCreditQuote>("ai-studio/credits/quote", {
    router: options.router,
    searchParams: {
      contextType,
      imageSize: options.imageSize,
      aspectRatio: options.aspectRatio,
    },
  });
}

export function resolveGenerationImageUrl(generation: AiImageGeneration | null | undefined): string | null {
  if (!generation) return null;
  return generation.imageUrl || generation.thumbnailUrl || null;
}

export function isGenerationTerminal(status?: string): boolean {
  const s = (status ?? "").toUpperCase();
  return s === "COMPLETED" || s === "FAILED" || s === "CANCELLED" || s === "ERROR";
}

export function isGenerationSuccessful(status?: string): boolean {
  return (status ?? "").toUpperCase() === "COMPLETED";
}

/** Poll generations until the given id is terminal or timeout. */
export async function pollGenerationUntilDone(options: {
  sessionId: string;
  generationId: string;
  kind: "room" | "reference";
  intervalMs?: number;
  timeoutMs?: number;
  router?: RouterLike;
}): Promise<AiImageGeneration> {
  const intervalMs = options.intervalMs ?? 4000;
  const timeoutMs = options.timeoutMs ?? 180_000;
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    const list =
      options.kind === "reference"
        ? await listReferenceGenerations(options.sessionId, undefined, options.router)
        : await listRoomGenerations(options.sessionId, undefined, options.router);
    const found = list.find((g) => g.id === options.generationId) ?? list[0];
    if (found && isGenerationTerminal(found.status)) {
      return found;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Üretim zaman aşımına uğradı. Lütfen tekrar deneyin.");
}
