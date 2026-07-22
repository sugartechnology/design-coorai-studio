"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";
import {
  listCollections,
  listProductFilterCategories,
} from "./catalog-api";
import type { CatalogCategory, CatalogCollection } from "./catalog-types";

export function useCatalogFilters() {
  const router = useRouter();
  const t = useTranslations("catalog");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [collections, setCollections] = useState<CatalogCollection[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await getPortalSessionView();
      if (!session) {
        router.replace("/login");
        return;
      }
      setCompanyId(session.companyId);
      const [cols, cats] = await Promise.all([
        listCollections(session.companyId, { router, size: 100 }),
        listProductFilterCategories(session.companyId, { router, size: 50 }),
      ]);
      setCollections(cols);
      setCategories(cats);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("filtersLoadError"));
      setCollections([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { companyId, collections, categories, loading, error, reload };
}
