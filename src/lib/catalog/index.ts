export type {
  CatalogCategory,
  CatalogCollection,
  CatalogProduct,
  CatalogProductBrief,
  CatalogProductDetail,
  SearchCriteria,
  SpringPage,
} from "./catalog-types";

export {
  buildProductSearchCriteria,
  getCollection,
  getProductById,
  listCollections,
  listProductFilterCategories,
  productsGroupedByCollection,
  searchRootProducts,
} from "./catalog-api";

export { useCatalogFilters } from "./use-catalog-filters";
export { useProductSearch } from "./use-product-search";
export { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
