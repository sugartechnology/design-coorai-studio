"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type UseInfiniteScrollOptions = {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  /** Scroll container; omit for viewport (window) scroll */
  root?: Element | null;
  /**
   * Ne kadar erken yükleme başlasın.
   * Varsayılan: viewport/panel yüksekliğinin ~1.5 katı alttan buffer.
   */
  rootMargin?: string;
  disabled?: boolean;
};

/**
 * IntersectionObserver ile listenin sonuna gelince onLoadMore tetikler.
 * root verilirse o container içinde scroll (oda paneli, modal vb.).
 */
export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  root = null,
  rootMargin = "0px 0px 150% 0px",
  disabled = false,
}: UseInfiniteScrollOptions) {
  const [sentinelNode, setSentinelNode] = useState<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const loadingRef = useRef(loading);
  const hasMoreRef = useRef(hasMore);
  onLoadMoreRef.current = onLoadMore;
  loadingRef.current = loading;
  hasMoreRef.current = hasMore;

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    setSentinelNode(node);
  }, []);

  useEffect(() => {
    if (disabled || !hasMore || !sentinelNode) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (loadingRef.current || !hasMoreRef.current) return;
        onLoadMoreRef.current();
      },
      { root, rootMargin, threshold: 0 },
    );
    observer.observe(sentinelNode);
    return () => observer.disconnect();
  }, [disabled, hasMore, root, rootMargin, sentinelNode]);

  return { sentinelRef };
}
