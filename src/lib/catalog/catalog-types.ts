export type SpringPage<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
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
};

export type CatalogProduct = {
  id: string;
  name: string;
  collectionId?: string | null;
  collectionName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  thumbnailUrl?: string | null;
};

export type CatalogProductBrief = {
  id?: string;
  name?: string;
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
