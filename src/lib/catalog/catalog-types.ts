export type SpringPage<T> = {
  content?: T[];
  /** Bazı Spring Page serializer'ları düz alan kullanır */
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  /** PagedFilterable CRM yanıtı: metadata `page` altında */
  page?: {
    size?: number;
    number?: number;
    totalElements?: number;
    totalPages?: number;
  };
};

export type CatalogCollection = {
  id: string;
  name: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  productCount?: number | null;
  companyId?: string | null;
};

export type CatalogCategory = {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  productCount?: number | null;
  /** Null/undefined = kök kategori */
  parentId?: string | null;
  hasChildren?: boolean | null;
};

export type CatalogProduct = {
  id: string;
  name: string;
  /** Sugar numeric id (API `sugarProductId`); CRM field name `productModalId` */
  productModalId?: string | null;
  collectionId?: string | null;
  collectionName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  thumbnailUrl?: string | null;
};

export type CatalogProductPrice = {
  amount?: number | null;
  currency?: string | { currencyCode?: string } | null;
  taxRate?: number | null;
};

export type CatalogProductImage = {
  id?: string;
  url?: string | null;
  thumbnailUrl?: string | null;
};

export type CatalogProductDetail = CatalogProduct & {
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

export type CatalogProductBrief = {
  id?: string;
  name?: string;
  productModalId?: string | null;
  thumbnailUrl?: string | null;
  collection?: { id?: string; name?: string } | null;
  category?: { id?: string; name?: string } | null;
  categories?: Array<{ id?: string; name?: string }>;
};

export type SearchFilterOption = {
  value: string;
  label?: string;
};

export type SearchFilter = {
  field: string;
  options?: SearchFilterOption[];
  query?: string;
  min?: string | number;
  max?: string | number;
};

export type SearchCriteria = {
  query?: string;
  page: number;
  size: number;
  sort?: Array<{ field: string; order: "ASC" | "DESC" }>;
  filters?: SearchFilter[];
  includeImages?: boolean;
};

export type PagedProducts = SpringPage<CatalogProductBrief>;
