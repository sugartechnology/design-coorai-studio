"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FolderOpen, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { AppHeader } from "@/components/AppHeader";
import { InfiniteScrollSentinel } from "@/components/InfiniteScrollSentinel";
import {
  getCategoryById,
  listChildCategories,
  useInfiniteScroll,
  useProductSearch,
  type CatalogCategory,
} from "@/lib/catalog";
import { PortalCrmError } from "@/lib/portal-crm";

const GRADIENTS = [
  "from-stone-200 via-stone-100 to-emerald-100",
  "from-slate-200 via-slate-100 to-zinc-200",
  "from-amber-100 via-stone-100 to-blue-100",
  "from-rose-100 via-stone-100 to-amber-100",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

function CategoryProductsPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categoryId = params.category;
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");

  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [children, setChildren] = useState<CatalogCategory[]>([]);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setMetaLoading(true);
      setMetaError(null);
      try {
        const cat = await getCategoryById(categoryId, router);
        if (cancelled) return;
        setCategory(cat);

        if (cat.hasChildren) {
          const kids = await listChildCategories(categoryId, {
            router,
            size: 200,
            search: debouncedQuery || undefined,
          });
          if (!cancelled) setChildren(kids);
        } else {
          setChildren([]);
        }
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setMetaError(err instanceof Error ? err.message : tCatalog("categoryLoadError"));
          setCategory(null);
          setChildren([]);
        }
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, router, tCatalog, debouncedQuery]);

  const showChildren = Boolean(category?.hasChildren);
  const {
    products,
    loading: productsLoading,
    loadingMore,
    error: productsError,
    totalElements,
    hasMore,
    loadMore,
  } = useProductSearch({
    query: showChildren ? "" : query,
    categoryId: showChildren ? null : categoryId,
    size: 40,
    // skip product search while drilling into child categories
    enabled: !showChildren && !metaLoading,
  });

  const { sentinelRef } = useInfiniteScroll({
    hasMore: showChildren ? false : hasMore,
    loading: productsLoading || loadingMore,
    onLoadMore: loadMore,
  });

  const backHref = category?.parentId
    ? `/kumas/kategori/${category.parentId}`
    : "/kumas";

  const subtitle = useMemo(() => {
    if (metaLoading) return t("categoriesLoading");
    if (showChildren) {
      return t("categoriesCountHint", { count: children.length });
    }
    if (productsLoading && products.length === 0) return t("productsLoading");
    return t("productsCountHint", { count: totalElements });
  }, [
    metaLoading,
    showChildren,
    children.length,
    productsLoading,
    products.length,
    totalElements,
    t,
  ]);

  const filteredChildren = useMemo(() => {
    if (!debouncedQuery || showChildren) {
      // server already searched when showChildren + debouncedQuery
      return children;
    }
    return children;
  }, [children, debouncedQuery, showChildren]);

  return (
    <>
      <AppHeader
        title={(category?.name || tCommon("categoryFallback")).toUpperCase()}
        backHref={backHref}
      />
      <main className="flex-1 min-h-0 overflow-y-auto px-6 lg:px-10 py-4 lg:py-6">
      <div className="mb-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50">
            {t("categoryEyebrow")}
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            {category?.name || tCommon("categoryFallback")}
          </h1>
          <p className="mt-1.5 text-[color:var(--istikbal-blue)]/60">{subtitle}</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              showChildren
                ? t("searchCategoryPlaceholder")
                : t("searchInCategoryPlaceholder")
            }
            className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-black/5 focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/40"
          />
        </div>
      </div>

      {(metaError || productsError) && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {metaError || productsError}
        </div>
      )}

      {metaLoading ? (
        <div className="rounded-2xl bg-white border border-black/5 py-12 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/60">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-semibold">{t("categoriesLoading")}</p>
        </div>
      ) : showChildren ? (
        filteredChildren.length === 0 ? (
          <div className="rounded-2xl bg-white border border-dashed border-black/10 py-12 text-center text-[color:var(--istikbal-blue)]/60">
            {t("emptyCategories")}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChildren.map((c) => (
              <Link
                key={c.id}
                href={`/kumas/kategori/${c.id}`}
                className="group rounded-2xl bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all hover:-translate-y-1 border border-black/5"
              >
                <div
                  className={`relative h-40 bg-gradient-to-br ${gradientFor(c.id)} overflow-hidden`}
                >
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnailUrl}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FolderOpen className="size-14 text-white/50" strokeWidth={1.25} />
                    </div>
                  )}
                </div>
                <div className="px-5 py-4 text-center">
                  <h3 className="text-base font-bold text-[color:var(--istikbal-blue)]">
                    {c.name}
                  </h3>
                  {c.productCount != null && (
                    <p className="mt-1 text-xs text-[color:var(--istikbal-blue)]/55">
                      {tCatalog("productCount", { count: c.productCount })}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      ) : productsLoading && products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/5 py-12 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/60">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-semibold">{t("productsLoading")}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-dashed border-black/10 py-12 text-center text-[color:var(--istikbal-blue)]/60">
          {t("emptyCategoryProducts")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const collectionSeg = p.collectionId || "_";
              return (
                <Link
                  key={p.id}
                  href={`/kumas/${collectionSeg}/${p.id}?kategori=${encodeURIComponent(categoryId)}`}
                  className="group rounded-2xl bg-white shadow-sm hover:shadow-xl border border-black/5 overflow-hidden transition-all hover:-translate-y-1"
                >
                  <div className="relative aspect-[4/5] bg-stone-100">
                    {p.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.thumbnailUrl}
                        alt={p.name}
                        className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-[color:var(--istikbal-blue)]/30">
                        {tCommon("noImage")}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-3">
                    <h3 className="text-sm font-bold text-[color:var(--istikbal-blue)] line-clamp-2">
                      {p.name}
                    </h3>
                    {p.collectionName && (
                      <p className="mt-1 text-[11px] text-[color:var(--istikbal-blue)]/50 truncate">
                        {p.collectionName}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <InfiniteScrollSentinel
            sentinelRef={sentinelRef}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        </>
      )}
      </main>
    </>
  );
}

export default CategoryProductsPage;
