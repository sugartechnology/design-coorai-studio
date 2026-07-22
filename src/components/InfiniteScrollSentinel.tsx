"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type InfiniteScrollSentinelProps = {
  /** useInfiniteScroll'un döndürdüğü callback ref */
  sentinelRef: (node: HTMLDivElement | null) => void;
  hasMore: boolean;
  loadingMore?: boolean;
  className?: string;
};

/** Listenin sonuna konur; IntersectionObserver sentinel + loading more göstergesi. */
export function InfiniteScrollSentinel({
  sentinelRef,
  hasMore,
  loadingMore = false,
  className = "",
}: InfiniteScrollSentinelProps) {
  const t = useTranslations("common");

  if (!hasMore && !loadingMore) return null;
  return (
    <div
      ref={sentinelRef}
      className={`flex min-h-8 items-center justify-center py-4 text-sm text-[color:var(--istikbal-blue)]/55 ${className}`}
      aria-hidden={!loadingMore}
    >
      {loadingMore ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" />
          {t("loadingMore")}
        </span>
      ) : (
        <span className="sr-only">{t("scrollForMore")}</span>
      )}
    </div>
  );
}
