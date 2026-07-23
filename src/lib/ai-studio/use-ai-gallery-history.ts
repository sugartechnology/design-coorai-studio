"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PortalCrmError } from "@/lib/portal-crm";
import { listAiGallery } from "./ai-studio-api";
import type { AiGalleryItem } from "./types";

type UseAiGalleryHistoryOptions = {
  contextTypes?: string[];
  sources?: string[];
  pageSize?: number;
  enabled?: boolean;
  /** Refresh first page when pending/processing items exist. */
  pollOnPending?: boolean;
  pollIntervalMs?: number;
};

export function useAiGalleryHistory({
  contextTypes = ["AI_STUDIO_ROOM"],
  sources,
  pageSize = 12,
  enabled = true,
  pollOnPending = true,
  pollIntervalMs = 5000,
}: UseAiGalleryHistoryOptions = {}) {
  const router = useRouter();
  const contextKey = useMemo(() => contextTypes.join("|"), [contextTypes]);
  const sourceKey = useMemo(() => (sources ?? []).join("|"), [sources]);

  const [items, setItems] = useState<AiGalleryItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoreLockRef = useRef(false);
  const refreshLockRef = useRef(false);
  const itemsRef = useRef<AiGalleryItem[]>([]);
  const [forcePollUntil, setForcePollUntil] = useState(0);

  const hasMore = page < totalPages - 1;

  itemsRef.current = items;

  const mergeItems = useCallback((incoming: AiGalleryItem[]) => {
    setItems((prev) => {
      const map = new Map<string, AiGalleryItem>();
      for (const item of prev) {
        if (item?.id) map.set(item.id, item);
      }
      for (const item of incoming) {
        if (item?.id) map.set(item.id, item);
      }
      return Array.from(map.values()).sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    });
  }, []);

  const kickPoll = useCallback((ms = 180_000) => {
    setForcePollUntil(Date.now() + ms);
  }, []);

  const fetchPage = useCallback(
    async (pageIndex: number) =>
      listAiGallery({
        page: pageIndex,
        size: pageSize,
        contextTypes,
        sources,
        router,
      }),
    [contextTypes, pageSize, router, sources],
  );

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPage(0);
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "gallery");
      setItems([]);
      setPage(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchPage]);

  const refresh = useCallback(async () => {
    if (!enabled || refreshLockRef.current) return;
    refreshLockRef.current = true;
    try {
      const data = await fetchPage(0);
      setItems((prev) => {
        const map = new Map<string, AiGalleryItem>();
        for (const item of prev) {
          if (item.id) map.set(item.id, item);
        }
        for (const item of data.items) {
          if (item.id) map.set(item.id, item);
        }
        // Prefer newest-first: keep API order for page 0, then older unique ids
        const ordered: AiGalleryItem[] = [];
        const seen = new Set<string>();
        for (const item of data.items) {
          if (!item.id || seen.has(item.id)) continue;
          seen.add(item.id);
          ordered.push(item);
        }
        for (const item of prev) {
          if (!item.id || seen.has(item.id)) continue;
          seen.add(item.id);
          ordered.push(item);
        }
        return ordered;
      });
      setPage((prev) => Math.max(prev, data.page));
      setTotalPages((prev) => Math.max(prev, data.totalPages));
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      // Soft-fail refresh; keep existing items.
      console.warn("[useAiGalleryHistory] refresh failed", err);
    } finally {
      refreshLockRef.current = false;
    }
  }, [enabled, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!enabled || loading || loadingMore || !hasMore || loadMoreLockRef.current) {
      return;
    }
    loadMoreLockRef.current = true;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchPage(nextPage);
      if (data.items.length === 0 || data.page <= page) {
        setTotalPages(page + 1);
        return;
      }
      setItems((prev) => {
        const map = new Map(prev.map((item) => [item.id, item]));
        for (const item of data.items) {
          if (item.id) map.set(item.id, item);
        }
        return Array.from(map.values());
      });
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "gallery");
    } finally {
      setLoadingMore(false);
      loadMoreLockRef.current = false;
    }
  }, [enabled, fetchPage, hasMore, loading, loadingMore, page]);

  useEffect(() => {
    if (!enabled) return;
    setPage(0);
    setTotalPages(1);
    void reload();
  }, [enabled, contextKey, sourceKey, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps -- reload on filter change

  useEffect(() => {
    if (!enabled || !pollOnPending) return;
    const hasPending = items.some((item) => {
      const status = (item.status ?? "").toUpperCase();
      return status === "PENDING" || status === "PROCESSING";
    });
    if (!hasPending && Date.now() >= forcePollUntil) return;
    const timer = window.setInterval(() => {
      const stillPending = itemsRef.current.some((item) => {
        const status = (item.status ?? "").toUpperCase();
        return status === "PENDING" || status === "PROCESSING";
      });
      if (!stillPending && Date.now() >= forcePollUntil) return;
      void refresh();
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [enabled, items, forcePollUntil, pollIntervalMs, pollOnPending, refresh]);

  return {
    items,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    reload,
    mergeItems,
    kickPoll,
  };
}
