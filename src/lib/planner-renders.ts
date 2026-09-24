"use client";

import { readPlannerTicket } from "@/lib/planner-auth-storage";

/** Same key as 3d-room-designer RenderGalleryStore. */
export const ROOM_RENDERS_STORAGE_KEY = "sugartech:room-designer:renders:v1";

export type GalleryRenderItem = {
  id: string;
  src: string;
  createdAt: number;
};

export type RapidRenderPage = {
  items: GalleryRenderItem[];
  page: number;
  totalPages: number;
};

export class PlannerRenderAuthError extends Error {
  constructor() {
    super("planner-auth");
    this.name = "PlannerRenderAuthError";
  }
}

export function listRoomRenderGallery(): GalleryRenderItem[] {
  try {
    const raw = localStorage.getItem(ROOM_RENDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const items: GalleryRenderItem[] = [];
    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const row = entry as Record<string, unknown>;
      const src = typeof row.dataUrl === "string" ? row.dataUrl.trim() : "";
      const id = typeof row.id === "string" ? row.id.trim() : "";
      if (!src || !id) continue;
      const createdAt =
        typeof row.createdAt === "number" && Number.isFinite(row.createdAt)
          ? row.createdAt
          : 0;
      items.push({ id, src, createdAt });
    }
    return items.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function listRapidRenderGallery(
  page = 1,
  pageSize = 12,
): Promise<RapidRenderPage> {
  const ticket = readPlannerTicket();
  if (!ticket) throw new PlannerRenderAuthError();

  const response = await fetch(
    `/api/planner/ai-renders?page=${encodeURIComponent(String(page))}&pageSize=${encodeURIComponent(String(pageSize))}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${ticket}`,
      },
      cache: "no-store",
    },
  );
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) throw new PlannerRenderAuthError();
  if (!response.ok) {
    throw new Error("planner-renders");
  }
  return parseRenderPage(data, page);
}

function parseRenderPage(value: unknown, fallbackPage: number): RapidRenderPage {
  const root = asRecord(value) ?? {};
  const pageNode = asRecord(root.page) ?? root;
  const rawItems =
    asArray(pageNode.content) ??
    asArray(root.content) ??
    asArray(root.infos) ??
    [];
  const totalPages =
    num(pageNode.totalPages) ??
    num(asRecord(root.paging)?.totalPage) ??
    num(root.totalPages) ??
    (rawItems.length ? 1 : 0);
  const parsedPage =
    (num(pageNode.number) ?? num(asRecord(root.paging)?.currentPage) ?? 0) + 1;
  const items: GalleryRenderItem[] = [];
  for (const entry of rawItems) {
    const info = parseRenderInfo(entry);
    if (!info) continue;
    items.push(info);
  }
  return {
    items,
    page: parsedPage > 0 ? parsedPage : fallbackPage,
    totalPages: Math.max(0, totalPages),
  };
}

function parseRenderInfo(value: unknown): GalleryRenderItem | null {
  const row = asRecord(value);
  if (!row) return null;
  const src =
    (typeof row.outputS3Path === "string" ? row.outputS3Path.trim() : "") ||
    (typeof row.thumbnailFileUrl === "string" ? row.thumbnailFileUrl.trim() : "");
  if (!src) return null;
  const id =
    (typeof row.uuid === "string" && row.uuid.trim()) ||
    (typeof row.id === "number" ? `id:${row.id}` : "") ||
    src;
  const parsed = typeof row.createdDate === "string" ? Date.parse(row.createdDate) : NaN;
  return {
    id,
    src,
    createdAt: Number.isFinite(parsed) ? parsed : 0,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function num(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}
