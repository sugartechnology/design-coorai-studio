"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";
import {
  buildCatalogProductSearchCriteria,
  searchCatalogProducts,
} from "./catalog-api";
import type {
  CatalogChannel,
  CatalogProduct,
  SearchFilter,
  SearchFilterOption,
} from "./catalog-types";

const PREFETCH_AHEAD_PAGES = 1;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_RE.test(value.trim());
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export type CatalogFacetSelection = {
  catalogIds: string[];
  /** UUID category filters (request field `categoryId`). */
  categoryIds: string[];
  /** Name category filters from aggregation (request field `category`). */
  categoryNames: string[];
  collectionIds: string[];
  collectionNames: string[];
};

const EMPTY_SELECTION: CatalogFacetSelection = {
  catalogIds: [],
  categoryIds: [],
  categoryNames: [],
  collectionIds: [],
  collectionNames: [],
};

export function useCatalogProductSearch(input: {
  query: string;
  channel?: CatalogChannel;
  currency?: string;
  enabled?: boolean;
  size?: number;
}) {
  const router = useRouter();
  const t = useTranslations("catalog");
  const pageSize = Math.min(input.size ?? 40, 100);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [aggregations, setAggregations] = useState<SearchFilter[]>([]);
  const [selection, setSelection] = useState<CatalogFacetSelection>(EMPTY_SELECTION);
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
    const handle = window.setTimeout(() => setDebouncedQuery(input.query.trim()), 300);
    return () => window.clearTimeout(handle);
  }, [input.query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const session = await getPortalSessionView();
      if (cancelled) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setCompanyId(session.companyId);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (input.enabled === false) return;
      if (!companyId) return;
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
        const result = await searchCatalogProducts(
          {
            companyId,
            channel: input.channel ?? "RAPID_RENDER",
            currency: input.currency,
            criteria: buildCatalogProductSearchCriteria({
              query: debouncedQuery,
              catalogIds: selection.catalogIds,
              categoryIds: selection.categoryIds,
              categoryNames: selection.categoryNames,
              collectionIds: selection.collectionIds,
              collectionNames: selection.collectionNames,
              page: pageToLoad,
              size: pageSize,
            }),
          },
          router,
        );
        if (requestId !== requestIdRef.current) return;
        totalRef.current = result.totalElements;
        setTotalElements(result.totalElements);
        pageRef.current = pageToLoad;
        setPage(pageToLoad);
        if (!append) {
          setAggregations(result.filters);
        }
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
          setAggregations([]);
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
      companyId,
      debouncedQuery,
      input.channel,
      input.currency,
      input.enabled,
      pageSize,
      router,
      selection,
      t,
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

  useEffect(() => {
    if (input.enabled === false) return;
    if (!companyId) return;
    if (loading || loadingMore || error) return;
    if (products.length === 0) return;
    if (products.length >= totalElements) return;
    if (page >= PREFETCH_AHEAD_PAGES) return;
    void fetchPage(page + 1, true);
  }, [
    companyId,
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

  const toggleFacetOption = useCallback((field: string, option: SearchFilterOption) => {
    const value = option.value?.trim();
    if (!value) return;
    setSelection((prev) => {
      if (field === "catalogs") {
        return { ...prev, catalogIds: toggleValue(prev.catalogIds, value) };
      }
      if (field === "categories" || field === "categoryId" || field === "category") {
        if (isUuid(value)) {
          return {
            ...prev,
            categoryIds: toggleValue(prev.categoryIds, value),
            categoryNames: [],
          };
        }
        return {
          ...prev,
          categoryNames: toggleValue(prev.categoryNames, value),
          categoryIds: [],
        };
      }
      if (field === "collections" || field === "collectionId" || field === "collection") {
        if (isUuid(value)) {
          return {
            ...prev,
            collectionIds: toggleValue(prev.collectionIds, value),
            collectionNames: [],
          };
        }
        return {
          ...prev,
          collectionNames: toggleValue(prev.collectionNames, value),
          collectionIds: [],
        };
      }
      return prev;
    });
  }, []);

  const clearFacets = useCallback(() => {
    setSelection(EMPTY_SELECTION);
  }, []);

  const isOptionSelected = useCallback(
    (field: string, option: SearchFilterOption) => {
      const value = option.value?.trim();
      if (!value) return Boolean(option.selected);
      if (field === "catalogs") return selection.catalogIds.includes(value);
      if (field === "categories" || field === "categoryId" || field === "category") {
        return (
          selection.categoryIds.includes(value) ||
          selection.categoryNames.includes(value)
        );
      }
      if (field === "collections" || field === "collectionId" || field === "collection") {
        return (
          selection.collectionIds.includes(value) ||
          selection.collectionNames.includes(value)
        );
      }
      return Boolean(option.selected);
    },
    [selection],
  );

  const facetFilters = useMemo(() => {
    const allowed = new Set(["catalogs", "categories", "collections"]);
    return aggregations.filter(
      (f) => f.field && allowed.has(f.field) && (f.options?.length ?? 0) > 0,
    );
  }, [aggregations]);

  const hasActiveFacets =
    selection.catalogIds.length > 0 ||
    selection.categoryIds.length > 0 ||
    selection.categoryNames.length > 0 ||
    selection.collectionIds.length > 0 ||
    selection.collectionNames.length > 0;

  return {
    companyId,
    products,
    totalElements,
    page,
    pageSize,
    hasMore,
    loading: loading || (!companyId && input.enabled !== false),
    loadingMore,
    error,
    loadMore,
    facetFilters,
    selection,
    hasActiveFacets,
    toggleFacetOption,
    clearFacets,
    isOptionSelected,
  };
}
