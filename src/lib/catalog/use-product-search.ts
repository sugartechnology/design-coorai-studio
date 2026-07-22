"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PortalCrmError } from "@/lib/portal-crm";
import { buildProductSearchCriteria, searchRootProducts } from "./catalog-api";
import type { CatalogProduct } from "./catalog-types";

/** İlk yüklemeden sonra kaç sayfa daha önceden ısıtılsın (scroll beklemeden). */
const PREFETCH_AHEAD_PAGES = 1;

export function useProductSearch(input: {
  query: string;
  collectionId?: string | null;
  categoryId?: string | null;
  enabled?: boolean;
  size?: number;
}) {
  const router = useRouter();
  const t = useTranslations("catalog");
  const pageSize = input.size ?? 48;
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(input.query.trim());
  const requestIdRef = useRef(0);
  const pageRef = useRef(0);
  const loadingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const totalRef = useRef(0);
  const productsLenRef = useRef(0);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(input.query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [input.query]);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (input.enabled === false) return;
      if (append) {
        if (loadingMoreRef.current || loadingRef.current) return;
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        loadingRef.current = true;
        setLoading(true);
      }
      const requestId = ++requestIdRef.current;
      setError(null);
      try {
        const result = await searchRootProducts(
          buildProductSearchCriteria({
            query: debouncedQuery,
            collectionId: input.collectionId,
            categoryId: input.categoryId,
            page: pageToLoad,
            size: pageSize,
          }),
          router,
        );
        if (requestId !== requestIdRef.current) return;
        totalRef.current = result.totalElements;
        setTotalElements(result.totalElements);
        pageRef.current = pageToLoad;
        setPage(pageToLoad);
        setProducts((prev) => {
          const next = !append
            ? result.products
            : (() => {
                const seen = new Set(prev.map((p) => p.id));
                const merged = [...prev];
                for (const p of result.products) {
                  if (!seen.has(p.id)) {
                    seen.add(p.id);
                    merged.push(p);
                  }
                }
                return merged;
              })();
          productsLenRef.current = next.length;
          return next;
        });
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        if (err instanceof PortalCrmError && err.status === 401) return;
        setError(err instanceof Error ? err.message : t("productsLoadError"));
        if (!append) {
          setProducts([]);
          productsLenRef.current = 0;
          setTotalElements(0);
          totalRef.current = 0;
          setPage(0);
          pageRef.current = 0;
        }
      } finally {
        if (requestId === requestIdRef.current) {
          loadingRef.current = false;
          loadingMoreRef.current = false;
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [
      router,
      t,
      debouncedQuery,
      input.collectionId,
      input.categoryId,
      input.enabled,
      pageSize,
    ],
  );

  useEffect(() => {
    setProducts([]);
    productsLenRef.current = 0;
    setTotalElements(0);
    totalRef.current = 0;
    setPage(0);
    pageRef.current = 0;
    void fetchPage(0, false);
  }, [fetchPage]);

  // İlk sayfa geldikten sonra bir sayfa daha ısıt — scroll’da boşluk hissini azaltır
  useEffect(() => {
    if (input.enabled === false) return;
    if (loading || loadingMore || error) return;
    if (products.length === 0) return;
    if (products.length >= totalElements) return;
    if (page >= PREFETCH_AHEAD_PAGES) return;
    void fetchPage(page + 1, true);
  }, [
    error,
    fetchPage,
    input.enabled,
    loading,
    loadingMore,
    page,
    products.length,
    totalElements,
  ]);

  const hasMore = products.length < totalElements;

  const loadMore = useCallback(() => {
    if (input.enabled === false) return;
    if (loadingRef.current || loadingMoreRef.current) return;
    if (productsLenRef.current >= totalRef.current) return;
    void fetchPage(pageRef.current + 1, true);
  }, [fetchPage, input.enabled]);

  const reload = useCallback(() => {
    setProducts([]);
    productsLenRef.current = 0;
    setTotalElements(0);
    totalRef.current = 0;
    setPage(0);
    pageRef.current = 0;
    return fetchPage(0, false);
  }, [fetchPage]);

  return {
    products,
    totalElements,
    page,
    pageSize,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    reload,
  };
}
