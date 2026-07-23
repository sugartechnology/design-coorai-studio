"use client";

import { portalCrmFetch } from "@/lib/portal-crm";
import { normalizeMediaUrlOrNull } from "@/lib/media-url";
import type {
  AiGalleryItem,
  AiGalleryPage,
  AiImageContext,
  AiImageGeneration,
  AiStudioCreditQuote,
  AiStudioRoomDesignRequest,
  AiStudioRoomReferenceRequest,
  CreditBalanceResponse,
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

export async function getCreditBalance(
  router?: RouterLike,
): Promise<CreditBalanceResponse> {
  return portalCrmFetch<CreditBalanceResponse>("credits/current", { router });
}

export async function listAiGallery(
  options: {
    contextTypes?: string[];
    statuses?: string[];
    sources?: string[];
    page?: number;
    size?: number;
    router?: RouterLike;
  } = {},
): Promise<{ items: AiGalleryItem[]; page: number; totalPages: number }> {
  const pageIndex = options.page ?? 0;
  const size = options.size ?? 12;
  const raw = await portalCrmFetch<AiGalleryPage>("ai/image-generation/gallery", {
    router: options.router,
    searchParams: {
      page: pageIndex,
      size,
      contextTypes: options.contextTypes?.length
        ? options.contextTypes
        : ["AI_STUDIO_ROOM"],
      statuses: options.statuses?.length
        ? options.statuses
        : ["PENDING", "PROCESSING", "COMPLETED"],
      sources: options.sources,
    },
  });

  const items = (raw.content ?? [])
    .filter(Boolean)
    .map((item) => ({
      ...item,
      imageUrl: normalizeMediaUrlOrNull(item.imageUrl) || item.imageUrl,
      thumbnailUrl: normalizeMediaUrlOrNull(item.thumbnailUrl) || item.thumbnailUrl,
    }));

  const pageNumber = raw.page?.number ?? raw.number ?? pageIndex;
  const totalPagesFromPayload = raw.page?.totalPages ?? raw.totalPages;
  const isLast =
    typeof raw.last === "boolean" ? raw.last : items.length < size;
  const totalPages =
    totalPagesFromPayload ?? (isLast ? pageNumber + 1 : pageNumber + 2);

  return {
    items,
    page: pageNumber,
    totalPages: Math.max(totalPages, 1),
  };
}

export function resolveGenerationImageUrl(generation: AiImageGeneration | null | undefined): string | null {
  if (!generation) return null;
  return (
    normalizeMediaUrlOrNull(generation.imageUrl) ||
    normalizeMediaUrlOrNull(generation.thumbnailUrl)
  );
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
