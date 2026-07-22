"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { InfiniteScrollSentinel } from "@/components/InfiniteScrollSentinel";
import {
  listProductFilterCategories,
  useInfiniteScroll,
  useProductSearch,
} from "@/lib/catalog";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";

function CategoryProductsPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categoryId = params.category;
  const [categoryName, setCategoryName] = useState("Kategori");
  const [query, setQuery] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const {
    products,
    loading,
    loadingMore,
    error,
    totalElements,
    hasMore,
    loadMore,
  } = useProductSearch({
    query,
    categoryId,
    size: 40,
  });

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: loadMore,
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getPortalSessionView();
        if (!session) {
          router.replace("/login");
          return;
        }
        const cats = await listProductFilterCategories(session.companyId, {
          router,
          size: 100,
        });
        const found = cats.find((c) => c.id === categoryId);
        if (!cancelled && found?.name) setCategoryName(found.name);
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setNameError(err instanceof Error ? err.message : "Kategori yüklenemedi.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryId, router]);

  const subtitle = useMemo(() => {
    if (loading && products.length === 0) return "Ürünler yükleniyor…";
    return `${totalElements} ürün · Kategoriye göre listeleniyor.`;
  }, [loading, products.length, totalElements]);

  return (
    <>
      <div className="mb-6">
        <Link
          href="/kumas"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)] hover:opacity-80"
        >
          <ArrowLeft className="size-4" /> Kategorilere dön
        </Link>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50">
            Kategori
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            {categoryName}
          </h1>
          <p className="mt-1.5 text-[color:var(--istikbal-blue)]/60">{subtitle}</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bu kategoride ürün ara…"
            className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-black/5 focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/40"
          />
        </div>
      </div>

      {(nameError || error) && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {nameError || error}
        </div>
      )}

      {loading && products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-black/5 py-20 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/60">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-semibold">Ürünler yükleniyor…</p>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl bg-white border border-dashed border-black/10 py-20 text-center text-[color:var(--istikbal-blue)]/60">
          Bu kategoride ürün bulunamadı.
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
                  <div className="relative aspect-square bg-stone-100">
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
                        Görsel yok
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
    </>
  );
}

export default CategoryProductsPage;
