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

function emptySelection(): CatalogFacetSelection {
  return {
    catalogIds: [],
    typeCategoryIds: [],
    categoryIds: [],
    categoryNames: [],
    collectionIds: [],
    collectionNames: [],
  };
}

function isFacetSelection(value: unknown): value is CatalogFacetSelection {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.catalogIds) &&
    Array.isArray(v.typeCategoryIds) &&
    Array.isArray(v.categoryIds) &&
    Array.isArray(v.categoryNames) &&
    Array.isArray(v.collectionIds) &&
    Array.isArray(v.collectionNames)
  );
}

function readPersistedSelection(key: string | null | undefined): CatalogFacetSelection {
  if (!key || typeof window === "undefined") return emptySelection();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return emptySelection();
    const parsed = JSON.parse(raw) as { selection?: unknown };
    if (isFacetSelection(parsed.selection)) return parsed.selection;
    if (isFacetSelection(parsed)) return parsed;
  } catch {
    // ignore
  }
  return emptySelection();
}

function writePersistedSelection(
  key: string | null | undefined,
  selection: CatalogFacetSelection,
) {
  if (!key || typeof window === "undefined") return;
  try {
    const prevRaw = window.localStorage.getItem(key);
    let prev: Record<string, unknown> = {};
    if (prevRaw) {
      try {
        const parsed = JSON.parse(prevRaw) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          prev = parsed as Record<string, unknown>;
        }
      } catch {
        prev = {};
      }
    }
    window.localStorage.setItem(
      key,
      JSON.stringify({ ...prev, selection }),
    );
  } catch {
    // ignore quota
  }
}

function collectAncestors(
  id: string,
  parentById: Map<string, string | null>,
): string[] {
  const ancestors: string[] = [];
  const visited = new Set<string>();
  let current = parentById.get(id) ?? null;
  while (current && visited.add(current)) {
    ancestors.push(current);
    current = parentById.get(current) ?? null;
  }
  return ancestors;
}

function collectDescendants(
  id: string,
  childrenByParent: Map<string, string[]>,
): string[] {
  const out: string[] = [];
  const stack = [...(childrenByParent.get(id) ?? [])];
  const visited = new Set<string>();
  while (stack.length) {
    const next = stack.pop()!;
    if (!visited.add(next)) continue;
    out.push(next);
    for (const child of childrenByParent.get(next) ?? []) stack.push(child);
  }
  return out;
}

function buildTypeCategoryIndex(options: SearchFilterOption[]) {
  const parentById = new Map<string, string | null>();
  const childrenByParent = new Map<string, string[]>();
  for (const option of options) {
    const id = option.value?.trim();
    if (!id) continue;
    const parent = option.parentValue?.trim() || null;
    parentById.set(id, parent);
    if (parent) {
      const list = childrenByParent.get(parent) ?? [];
      list.push(id);
      childrenByParent.set(parent, list);
    }
  }
  return { parentById, childrenByParent };
}

function pruneAfterTypeCategoryToggle(
  ids: string[],
  toggledId: string,
  options: SearchFilterOption[],
): string[] {
  const { parentById, childrenByParent } = buildTypeCategoryIndex(options);
  const ancestors = new Set(collectAncestors(toggledId, parentById));
  const descendants = new Set(collectDescendants(toggledId, childrenByParent));
  return ids.filter(
    (id) => id === toggledId || (!ancestors.has(id) && !descendants.has(id)),
  );
}

function stripAncestorTypeCategories(
  ids: string[],
  options: SearchFilterOption[],
): string[] {
  if (ids.length <= 1) return ids;
  const { parentById } = buildTypeCategoryIndex(options);
  return ids.filter(
    (id) =>
      !ids.some(
        (other) => other !== id && collectAncestors(other, parentById).includes(id),
      ),
  );
}

export type CatalogFacetSelection = {
  catalogIds: string[];
  typeCategoryIds: string[];
  categoryIds: string[];
  categoryNames: string[];
  collectionIds: string[];
  collectionNames: string[];
};

export function useCatalogProductSearch(input: {
  query: string;
  channel?: CatalogChannel;
  currency?: string;
  enabled?: boolean;
  size?: number;
  /** Extra category filter (e.g. AI picker chips), merged with facet selection. */
  categoryId?: string | null;
  /** Extra collection filter (e.g. AI picker chips), merged with facet selection. */
  collectionId?: string | null;
  /** When set, facet selection is restored/saved in localStorage under this key. */
  persistKey?: string | null;
}) {
  const router = useRouter();
  const t = useTranslations("catalog");
  const pageSize = Math.min(input.size ?? 40, 100);
  const channel = input.channel ?? "RAPID_RENDER";
  const currency = input.currency;
  const enabled = input.enabled !== false;
  const persistKey = input.persistKey?.trim() || null;

  const [companyId, setCompanyId] = useState<string | null>(null);
  const [rrCompanyId, setRrCompanyId] = useState<number | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [aggregations, setAggregations] = useState<SearchFilter[]>([]);
  const [catalogUniverse, setCatalogUniverse] = useState<SearchFilter | null>(null);
  const [selection, setSelection] = useState<CatalogFacetSelection>(emptySelection);
  const [persistHydrated, setPersistHydrated] = useState(!persistKey);
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
  const typeCategoryOptionsRef = useRef<SearchFilterOption[]>([]);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  useEffect(() => {
    if (!persistKey) {
      setPersistHydrated(true);
      return;
    }
    setSelection(readPersistedSelection(persistKey));
    setPersistHydrated(true);
  }, [persistKey]);

  useEffect(() => {
    if (!persistHydrated) return;
    writePersistedSelection(persistKey, selection);
  }, [persistKey, persistHydrated, selection]);

  useEffect(() => {
    if (!enabled || !companyId) return;
    let cancelled = false;
    void (async () => {
      try {
        const result = await searchCatalogProducts(
          {
            companyId,
            channel,
            currency,
            criteria: buildCatalogProductSearchCriteria({
              query: "",
              page: 0,
              size: 1,
            }),
          },
          router,
        );
        if (cancelled) return;
        const catalogs = result.filters.find((filter) => filter.field === "catalogs");
        if (catalogs) setCatalogUniverse(catalogs);
      } catch {
        // Product search still supplies other facets; catalog list stays empty until retry.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channel, companyId, currency, enabled, router]);

  useEffect(() => {
    const facet = aggregations.find((filter) => filter.field === "typeCategories");
    typeCategoryOptionsRef.current = facet?.options ?? [];
  }, [aggregations]);

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
      setRrCompanyId(
        typeof session.rrCompanyId === "number" && Number.isFinite(session.rrCompanyId)
          ? session.rrCompanyId
          : null,
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (!enabled) return;
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
      const currentSelection = selectionRef.current;
      setError(null);
      try {
        const typeCategoryIds = stripAncestorTypeCategories(
          currentSelection.typeCategoryIds,
          typeCategoryOptionsRef.current,
        );
        const extraCategoryId = input.categoryId?.trim() || "";
        const extraCollectionId = input.collectionId?.trim() || "";
        const categoryIds = extraCategoryId
          ? Array.from(new Set([...currentSelection.categoryIds, extraCategoryId]))
          : currentSelection.categoryIds;
        const collectionIds = extraCollectionId
          ? Array.from(new Set([...currentSelection.collectionIds, extraCollectionId]))
          : currentSelection.collectionIds;
        const result = await searchCatalogProducts(
          {
            companyId,
            channel,
            currency,
            criteria: buildCatalogProductSearchCriteria({
              query: debouncedQuery,
              catalogIds: currentSelection.catalogIds,
              typeCategoryIds,
              categoryIds,
              categoryNames: currentSelection.categoryNames,
              collectionIds,
              collectionNames: currentSelection.collectionNames,
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
          setAggregations(
            result.filters.filter((filter) => filter.field !== "catalogs"),
          );
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
      channel,
      companyId,
      currency,
      debouncedQuery,
      enabled,
      input.categoryId,
      input.collectionId,
      pageSize,
      router,
      t,
    ],
  );

  // Reset + fetch only when search inputs change — not when aggregations update.
  useEffect(() => {
    if (!enabled || !companyId) return;
    productsLenRef.current = 0;
    totalRef.current = 0;
    setPage(0);
    pageRef.current = 0;
    void fetchPage(0, false);
  }, [
    companyId,
    debouncedQuery,
    enabled,
    fetchPage,
    selection.catalogIds,
    selection.typeCategoryIds,
    selection.categoryIds,
    selection.categoryNames,
    selection.collectionIds,
    selection.collectionNames,
    input.categoryId,
    input.collectionId,
  ]);

  useEffect(() => {
    if (!enabled) return;
    if (!companyId) return;
    if (loading || loadingMore || error) return;
    if (products.length === 0) return;
    if (products.length >= totalElements) return;
    if (page >= PREFETCH_AHEAD_PAGES) return;
    void fetchPage(page + 1, true);
  }, [
    companyId,
    enabled,
    error,
    fetchPage,
    loading,
    loadingMore,
    page,
    products.length,
    totalElements,
  ]);

  const hasMore = products.length < totalElements;

  const loadMore = useCallback(() => {
    if (!enabled) return;
    if (loadingRef.current || loadingMoreRef.current) return;
    if (productsLenRef.current >= totalRef.current) return;
    void fetchPage(pageRef.current + 1, true);
  }, [enabled, fetchPage]);

  const toggleFacetOption = useCallback((field: string, option: SearchFilterOption) => {
    const value = option.value?.trim();
    if (!value) return;
    setSelection((prev) => {
      if (field === "catalogs") {
        return { ...prev, catalogIds: toggleValue(prev.catalogIds, value) };
      }
      if (
        field === "typeCategories" ||
        field === "typeCategoryId" ||
        field === "typeCategoryIds"
      ) {
        const adding = !prev.typeCategoryIds.includes(value);
        let nextIds = toggleValue(prev.typeCategoryIds, value);
        if (adding) {
          nextIds = pruneAfterTypeCategoryToggle(
            nextIds,
            value,
            typeCategoryOptionsRef.current,
          );
        }
        return {
          ...prev,
          typeCategoryIds: nextIds,
          categoryIds: [],
          categoryNames: [],
        };
      }
      if (field === "categories" || field === "categoryId" || field === "category") {
        if (isUuid(value)) {
          return {
            ...prev,
            categoryIds: toggleValue(prev.categoryIds, value),
            categoryNames: [],
            typeCategoryIds: [],
          };
        }
        return {
          ...prev,
          categoryNames: toggleValue(prev.categoryNames, value),
          categoryIds: [],
          typeCategoryIds: [],
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
    setSelection(emptySelection());
  }, []);

  const isOptionSelected = useCallback(
    (field: string, option: SearchFilterOption) => {
      const value = option.value?.trim();
      if (!value) return false;
      if (field === "catalogs") return selection.catalogIds.includes(value);
      if (
        field === "typeCategories" ||
        field === "typeCategoryId" ||
        field === "typeCategoryIds"
      ) {
        return selection.typeCategoryIds.includes(value);
      }
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
      return false;
    },
    [selection],
  );

  const facetFilters = useMemo(() => {
    const hasTypeCategories = aggregations.some(
      (f) => f.field === "typeCategories" && (f.options?.length ?? 0) > 0,
    );
    const allowed = new Set(
      hasTypeCategories
        ? ["typeCategories", "collections"]
        : ["categories", "collections"],
    );
    const rest = aggregations.filter(
      (f) => f.field && allowed.has(f.field) && (f.options?.length ?? 0) > 0,
    );
    const catalogs =
      catalogUniverse && (catalogUniverse.options?.length ?? 0) > 0
        ? catalogUniverse
        : aggregations.find(
            (f) => f.field === "catalogs" && (f.options?.length ?? 0) > 0,
          );
    return catalogs ? [catalogs, ...rest] : rest;
  }, [aggregations, catalogUniverse]);

  const activeFacetCount =
    selection.catalogIds.length +
    selection.typeCategoryIds.length +
    selection.categoryIds.length +
    selection.categoryNames.length +
    selection.collectionIds.length +
    selection.collectionNames.length;

  return {
    companyId,
    rrCompanyId,
    products,
    totalElements,
    page,
    pageSize,
    hasMore,
    loading: loading || (!companyId && enabled),
    loadingMore,
    error,
    loadMore,
    facetFilters,
    selection,
    hasActiveFacets: activeFacetCount > 0,
    activeFacetCount,
    toggleFacetOption,
    clearFacets,
    isOptionSelected,
  };
}
