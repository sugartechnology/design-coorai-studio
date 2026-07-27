export type {
  CatalogCategory,
  CatalogChannel,
  CatalogCollection,
  CatalogProduct,
  CatalogProductBrief,
  CatalogProductDetail,
  CatalogProductSearchResult,
  SearchCriteria,
  SearchFilter,
  SearchFilterOption,
  SpringPage,
} from "./catalog-types";

export {
  buildCatalogProductSearchCriteria,
  buildProductSearchCriteria,
  getCategoryById,
  getCollection,
  getProductById,
  listChildCategories,
  listCollections,
  listProductFilterCategories,
  productsGroupedByCollection,
  searchCatalogProducts,
  searchRootProducts,
} from "./catalog-api";

export { useCatalogFilters } from "./use-catalog-filters";
export { useCatalogProductSearch } from "./use-catalog-product-search";
export { useProductSearch } from "./use-product-search";
export { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
