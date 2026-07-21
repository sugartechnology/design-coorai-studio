"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PortalCrmError } from "@/lib/portal-crm";
import { buildProductSearchCriteria, searchRootProducts } from "./catalog-api";
import type { CatalogProduct } from "./catalog-types";

export function useProductSearch(input: {
  query: string;
  collectionId?: string | null;
  categoryId?: string | null;
  enabled?: boolean;
  size?: number;
}) {
  const router = useRouter();
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(input.query.trim());

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(input.query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [input.query]);

  const reload = useCallback(async () => {
    if (input.enabled === false) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchRootProducts(
        buildProductSearchCriteria({
          query: debouncedQuery,
          collectionId: input.collectionId,
          categoryId: input.categoryId,
          size: input.size ?? 40,
        }),
        router,
      );
      setProducts(result.products);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Ürünler yüklenemedi.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [router, debouncedQuery, input.collectionId, input.categoryId, input.enabled, input.size]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { products, loading, error, reload };
}
