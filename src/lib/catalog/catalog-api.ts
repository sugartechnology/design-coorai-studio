"use client";

import { portalCrmFetch } from "@/lib/portal-crm";
import { normalizeMediaUrlOrNull } from "@/lib/media-url";
import type {
  CatalogCategory,
  CatalogChannel,
  CatalogCollection,
  CatalogProduct,
  CatalogProductBrief,
  CatalogProductDetail,
  CatalogProductImage,
  CatalogProductPrice,
  CatalogProductSearchResult,
  PagedProducts,
  SearchCriteria,
  SearchFilter,
  SpringPage,
} from "./catalog-types";

type RouterLike = { replace: (href: string) => void };

type CrmProductDetail = CatalogProductBrief & {
  sku?: string | null;
  description?: string | null;
  productModalId?: string | null;
  width?: number | null;
  height?: number | null;
  depth?: number | null;
  stockQuantity?: number | null;
  prices?: CatalogProductPrice[];
  images?: CatalogProductImage[];
};

function mapImage(raw: CatalogProductImage): CatalogProductImage {
  return {
    ...raw,
    url: normalizeMediaUrlOrNull(raw.url),
    thumbnailUrl: normalizeMediaUrlOrNull(raw.thumbnailUrl),
  };
}

function mapProduct(raw: CatalogProductBrief): CatalogProduct | null {
  if (!raw.id || !raw.name) return null;
  const category = raw.category ?? raw.categories?.[0];
  return {
    id: raw.id,
    name: raw.name,
    productModalId: raw.productModalId ?? null,
    collectionId: raw.collection?.id ?? null,
    collectionName: raw.collection?.name ?? null,
    categoryId: category?.id ?? null,
    categoryName: category?.name ?? null,
    thumbnailUrl: normalizeMediaUrlOrNull(raw.thumbnailUrl),
  };
}

function mapProductDetail(raw: CrmProductDetail): CatalogProductDetail | null {
  const base = mapProduct(raw);
  if (!base) return null;
  return {
    ...base,
    sku: raw.sku ?? null,
    description: raw.description ?? null,
    productModalId: raw.productModalId ?? null,
    width: raw.width ?? null,
    height: raw.height ?? null,
    depth: raw.depth ?? null,
    stockQuantity: raw.stockQuantity ?? null,
    prices: raw.prices ?? [],
    images: (raw.images ?? []).map(mapImage),
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
  return (page.content ?? []).map((c) => ({
    ...c,
    thumbnailUrl: normalizeMediaUrlOrNull(c.thumbnailUrl),
  }));
}

export async function getCollection(
  collectionId: string,
  router?: RouterLike,
): Promise<CatalogCollection> {
  const c = await portalCrmFetch<CatalogCollection>(
    `collections/${encodeURIComponent(collectionId)}`,
    { router },
  );
  return {
    ...c,
    thumbnailUrl: normalizeMediaUrlOrNull(c.thumbnailUrl),
  };
}

export async function listProductFilterCategories(
  _companyId: string,
  options: {
    size?: number;
    page?: number;
    search?: string;
    /** Only categories with no parent (hierarchy roots). Default true. */
    rootsOnly?: boolean;
    router?: RouterLike;
  } = {},
): Promise<CatalogCategory[]> {
  // companyIds gönderme: bayi session'ında sadece kendi id'si olur; parent
  // (İstikbal) kategorileri elenir. CRM read-scope zaten görünür owner'ları çözer.
  const rootsOnly = options.rootsOnly !== false;
  const page = await portalCrmFetch<SpringPage<CatalogCategory>>("categories/product-filter-options", {
    router: options.router,
    searchParams: {
      size: options.size ?? 200,
      page: options.page ?? 0,
      sort: "name,asc",
      search: options.search?.trim() || undefined,
    },
  });
  const mapped = (page.content ?? []).map((c) => ({
    ...c,
    parentId: c.parentId ?? null,
    hasChildren: c.hasChildren ?? false,
    thumbnailUrl: normalizeMediaUrlOrNull(c.thumbnailUrl),
  }));
  if (!rootsOnly) return mapped;
  return mapped.filter((c) => !c.parentId);
}

export async function getCategoryById(
  categoryId: string,
  router?: RouterLike,
): Promise<CatalogCategory> {
  const c = await portalCrmFetch<CatalogCategory>(
    `categories/${encodeURIComponent(categoryId)}`,
    { router },
  );
  return {
    ...c,
    parentId: c.parentId ?? null,
    hasChildren: c.hasChildren ?? false,
    thumbnailUrl: normalizeMediaUrlOrNull(c.thumbnailUrl),
  };
}

/** Child categories of a parent (from product-filter-options). */
export async function listChildCategories(
  parentId: string,
  options: { size?: number; search?: string; router?: RouterLike } = {},
): Promise<CatalogCategory[]> {
  const page = await portalCrmFetch<SpringPage<CatalogCategory>>("categories/product-filter-options", {
    router: options.router,
    searchParams: {
      size: options.size ?? 200,
      page: 0,
      sort: "name,asc",
      search: options.search?.trim() || undefined,
    },
  });
  return (page.content ?? [])
    .map((c) => ({
      ...c,
      parentId: c.parentId ?? null,
      hasChildren: c.hasChildren ?? false,
      thumbnailUrl: normalizeMediaUrlOrNull(c.thumbnailUrl),
    }))
    .filter((c) => c.parentId === parentId);
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
      thumbnailUrl: normalizeMediaUrlOrNull(first.thumbnailUrl),
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
  const totalElements =
    page.page?.totalElements ??
    page.totalElements ??
    // Son çare: dolu sayfa geldiyse daha fazla olabilir
    (products.length >= (criteria.size || 40)
      ? products.length + 1
      : products.length);
  return { products, totalElements };
}

/**
 * Catalog-scoped product search with aggregations
 * (`POST /api/catalog/products/search`).
 */
export async function searchCatalogProducts(
  input: {
    companyId: string;
    channel?: CatalogChannel;
    currency?: string;
    pricingDate?: string;
    criteria: SearchCriteria;
  },
  router?: RouterLike,
): Promise<CatalogProductSearchResult> {
  const page = await portalCrmFetch<PagedProducts>("catalog/products/search", {
    method: "POST",
    router,
    searchParams: {
      companyId: input.companyId,
      channel: input.channel ?? "RAPID_RENDER",
      currency: input.currency,
      pricingDate: input.pricingDate,
    },
    body: {
      ...input.criteria,
      includeImages: input.criteria.includeImages ?? true,
      groupBy: input.criteria.groupBy ?? null,
    },
  });
  const products = (page.content ?? [])
    .map(mapProduct)
    .filter((p): p is CatalogProduct => p !== null);
  const totalElements =
    page.page?.totalElements ??
    page.totalElements ??
    (products.length >= (input.criteria.size || 40)
      ? products.length + 1
      : products.length);
  return {
    products,
    totalElements,
    filters: page.filters ?? [],
  };
}

/** Build request filters for catalog product search (same field OR, different fields AND). */
export function buildCatalogProductSearchCriteria(input: {
  query?: string;
  catalogIds?: string[];
  categoryIds?: string[];
  collectionIds?: string[];
  /** Name-based facet values from response aggregations (`categories` / `collections`). */
  categoryNames?: string[];
  collectionNames?: string[];
  page?: number;
  size?: number;
}): SearchCriteria {
  const filters: SearchFilter[] = [];
  if (input.catalogIds?.length) {
    filters.push({
      field: "catalogs",
      options: input.catalogIds.map((value) => ({ value })),
    });
  }
  if (input.categoryIds?.length) {
    filters.push({
      field: "categoryId",
      options: input.categoryIds.map((value) => ({ value })),
    });
  } else if (input.categoryNames?.length) {
    // Aggregation facet values are category names (`categories.name.keyword`).
    filters.push({
      field: "category",
      options: input.categoryNames.map((value) => ({ value, label: value })),
    });
  }
  if (input.collectionIds?.length) {
    filters.push({
      field: "collectionId",
      options: input.collectionIds.map((value) => ({ value })),
    });
  } else if (input.collectionNames?.length) {
    filters.push({
      field: "collection",
      options: input.collectionNames.map((value) => ({ value, label: value })),
    });
  }
  return {
    query: input.query?.trim() || undefined,
    page: input.page ?? 0,
    size: Math.min(input.size ?? 40, 100),
    sort: [{ field: "name.keyword", order: "ASC" }],
    filters: filters.length ? filters : undefined,
    includeImages: true,
    groupBy: null,
  };
}

export async function getProductById(
  productId: string,
  router?: RouterLike,
): Promise<CatalogProductDetail> {
  const encoded = encodeURIComponent(productId);
  const [raw, images] = await Promise.all([
    portalCrmFetch<CrmProductDetail>(`products/${encoded}`, { router }),
    portalCrmFetch<CatalogProductImage[]>(`products/${encoded}/images`, { router }).catch(
      () => [] as CatalogProductImage[],
    ),
  ]);
  const mapped = mapProductDetail({
    ...raw,
    images: (images?.length ? images : raw.images) ?? [],
  });
  if (!mapped) {
    throw new Error("Ürün bulunamadı.");
  }
  return mapped;
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
