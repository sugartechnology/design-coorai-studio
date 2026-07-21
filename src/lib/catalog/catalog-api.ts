"use client";

import { portalCrmFetch } from "@/lib/portal-crm";
import type {
  CatalogCategory,
  CatalogCollection,
  CatalogProduct,
  CatalogProductBrief,
  PagedProducts,
  SearchCriteria,
  SpringPage,
} from "./catalog-types";

type RouterLike = { replace: (href: string) => void };

function mapProduct(raw: CatalogProductBrief): CatalogProduct | null {
  if (!raw.id || !raw.name) return null;
  const category = raw.category ?? raw.categories?.[0];
  return {
    id: raw.id,
    name: raw.name,
    collectionId: raw.collection?.id ?? null,
    collectionName: raw.collection?.name ?? null,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    thumbnailUrl: raw.thumbnailUrl ?? null,
  };
}

export async function listCollections(
  companyId: string,
  options: {
    search?: string;
    size?: number;
    page?: number;
    router?: RouterLike;
  } = {},
): Promise<CatalogCollection[]> {
  const page = await portalCrmFetch<SpringPage<CatalogCollection>>("collections", {
    router: options.router,
    searchParams: {
      companyIds: companyId,
      search: options.search,
      size: options.size ?? 100,
      page: options.page ?? 0,
      sort: "name,asc",
    },
  });
  return page.content ?? [];
}

export async function getCollection(
  collectionId: string,
  router?: RouterLike,
): Promise<CatalogCollection> {
  return portalCrmFetch<CatalogCollection>(`collections/${encodeURIComponent(collectionId)}`, {
    router,
  });
}

export async function listProductFilterCategories(
  companyId: string,
  options: { size?: number; router?: RouterLike } = {},
): Promise<CatalogCategory[]> {
  const page = await portalCrmFetch<SpringPage<CatalogCategory>>("categories/product-filter-options", {
    router: options.router,
    searchParams: {
      companyIds: companyId,
      size: options.size ?? 50,
      page: 0,
      sort: "name,asc",
    },
  });
  return page.content ?? [];
}

export async function productsGroupedByCollection(
  categoryId: string,
  router?: RouterLike,
): Promise<CatalogCollection[]> {
  const grouped = await portalCrmFetch<Record<string, CatalogProductBrief[]>>(
    `products/categories/${encodeURIComponent(categoryId)}/group-by-collection`,
    { router },
  );
  const cards: CatalogCollection[] = [];
  for (const [collectionName, products] of Object.entries(grouped ?? {})) {
    if (!collectionName || !products?.length) continue;
    const first = products[0];
    const id = first.collection?.id;
    if (!id) continue;
    cards.push({
      id,
      name: first.collection?.name || collectionName,
      thumbnailUrl: first.thumbnailUrl ?? null,
      productCount: products.length,
    });
  }
  return cards;
}

export async function searchRootProducts(
  criteria: SearchCriteria,
  router?: RouterLike,
): Promise<{ products: CatalogProduct[]; totalElements: number }> {
  const page = await portalCrmFetch<PagedProducts>("products/search-root", {
    method: "POST",
    router,
    body: {
      ...criteria,
      includeImages: criteria.includeImages ?? true,
    },
  });
  const products = (page.content ?? [])
    .map(mapProduct)
    .filter((p): p is CatalogProduct => p !== null);
  return { products, totalElements: page.totalElements ?? products.length };
}

export function buildProductSearchCriteria(input: {
  query?: string;
  collectionId?: string | null;
  categoryId?: string | null;
  page?: number;
  size?: number;
}): SearchCriteria {
  const filters = [];
  if (input.collectionId) {
    filters.push({
      field: "collectionId",
      options: [{ value: input.collectionId }],
    });
  }
  if (input.categoryId) {
    filters.push({
      field: "categoryId",
      options: [{ value: input.categoryId }],
    });
  }
  return {
    query: input.query?.trim() || undefined,
    page: input.page ?? 0,
    size: input.size ?? 40,
    sort: [{ field: "name", order: "ASC" }],
    filters: filters.length ? filters : undefined,
    includeImages: true,
  };
}
