"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Grid3x3,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  listCollections,
  listProductFilterCategories,
  productsGroupedByCollection,
  type CatalogCategory,
  type CatalogCollection,
} from "@/lib/catalog";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";

type SortKey = "default" | "name-asc" | "name-desc";

const GRADIENTS = [
  "from-stone-200 via-stone-100 to-emerald-100",
  "from-slate-200 via-slate-100 to-zinc-200",
  "from-amber-100 via-stone-100 to-blue-100",
  "from-rose-100 via-stone-100 to-amber-100",
  "from-sky-100 via-stone-100 to-emerald-100",
  "from-amber-200 via-amber-50 to-stone-100",
  "from-zinc-200 via-stone-100 to-slate-200",
  "from-emerald-100 via-stone-100 to-teal-100",
];

const ACCENTS = [
  "bg-emerald-300/40",
  "bg-slate-400/30",
  "bg-blue-300/30",
  "bg-rose-200/50",
  "bg-sky-300/30",
  "bg-amber-300/30",
  "bg-zinc-400/30",
  "bg-teal-300/30",
];

function gradientFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % GRADIENTS.length;
  return { gradient: GRADIENTS[idx], accent: ACCENTS[idx] };
}

function CollectionsPage() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [collections, setCollections] = useState<CatalogCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getPortalSessionView();
        if (!session) {
          router.replace("/login");
          return;
        }
        if (cancelled) return;
        setCompanyId(session.companyId);
        const cats = await listProductFilterCategories(session.companyId, { router });
        if (!cancelled) setCategories(cats);
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Kategoriler yüklenemedi.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadCollections = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    try {
      if (categoryId === "all") {
        const list = await listCollections(companyId, {
          router,
          search: debouncedQuery || undefined,
          size: 100,
        });
        setCollections(list);
      } else {
        const cards = await productsGroupedByCollection(categoryId, router);
        const filtered = debouncedQuery
          ? cards.filter((c) => c.name.toLowerCase().includes(debouncedQuery.toLowerCase()))
          : cards;
        setCollections(filtered);
      }
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : "Koleksiyonlar yüklenemedi.");
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [router, companyId, categoryId, debouncedQuery]);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  const filtered = useMemo(() => {
    let list = [...collections];
    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name, "tr"));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name, "tr"));
        break;
      default:
        break;
    }
    return list;
  }, [collections, sort]);

  const chips: { key: string; label: string }[] = [
    { key: "all", label: "Tümü" },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {chips.map(({ key, label }) => {
            const active = categoryId === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryId(key)}
                className={`inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm font-semibold transition-all border ${
                  active
                    ? "bg-[color:var(--istikbal-blue)] text-white border-[color:var(--istikbal-blue)] shadow-sm"
                    : "bg-white text-[color:var(--istikbal-blue)]/70 border-black/5 hover:border-[color:var(--istikbal-blue)]/30 hover:text-[color:var(--istikbal-blue)]"
                }`}
              >
                {key === "all" ? <Grid3x3 className="size-4" /> : <FolderOpen className="size-4" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            Koleksiyonlar
          </h1>
          <p className="mt-1.5 text-[color:var(--istikbal-blue)]/60">
            {loading
              ? "Koleksiyonlar yükleniyor…"
              : `${filtered.length} koleksiyon · Bir koleksiyon seçin, parçaları ve kumaş seçeneklerini keşfedin.`}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Koleksiyon adı ile ara…"
              className="w-full h-11 pl-11 pr-4 rounded-full bg-white border border-black/5 focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/40 transition-all"
            />
          </div>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/50 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-11 pl-9 pr-8 rounded-full bg-white border border-black/5 text-sm font-semibold text-[color:var(--istikbal-blue)] outline-none focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 appearance-none cursor-pointer"
            >
              <option value="default">Varsayılan</option>
              <option value="name-asc">İsim (A → Z)</option>
              <option value="name-desc">İsim (Z → A)</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-white border border-black/5 py-20 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/60">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-semibold">Koleksiyonlar yükleniyor…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-dashed border-black/10 py-20 text-center text-[color:var(--istikbal-blue)]/60">
          Aramanızla eşleşen koleksiyon bulunamadı.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const { gradient, accent } = gradientFor(c.id);
            return (
              <Link
                key={c.id}
                href={`/kumas/${c.id}`}
                className="group rounded-2xl bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all hover:-translate-y-1 border border-black/5"
              >
                <div className={`relative h-64 bg-gradient-to-br ${gradient} overflow-hidden`}>
                  {c.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.thumbnailUrl}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <RoomScene accent={accent} />
                  )}
                </div>

                <div className="px-5 py-5 text-center">
                  <h3 className="text-base font-bold text-[color:var(--istikbal-blue)]">{c.name}</h3>
                  {c.productCount != null && (
                    <p className="mt-2 text-xs text-[color:var(--istikbal-blue)]/55">
                      {c.productCount} ürün
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function RoomScene({ accent }: { accent: string }) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/5" />
      <div className={`absolute left-1/2 -translate-x-1/2 bottom-3 w-3/4 h-4 rounded-full blur-md ${accent}`} />
      <div className="absolute left-6 top-6 w-14 h-20 rounded-md bg-white/60 border border-white shadow-sm" />
      <div className="absolute right-8 top-8 w-10 h-10 rounded-full bg-white/50" />
      <svg viewBox="0 0 280 140" className="absolute inset-x-0 bottom-2 mx-auto w-[78%] drop-shadow-md" fill="none">
        <rect x="20" y="60" width="240" height="55" rx="14" fill="white" />
        <rect x="14" y="70" width="28" height="50" rx="10" fill="white" />
        <rect x="238" y="70" width="28" height="50" rx="10" fill="white" />
        <rect x="40" y="42" width="200" height="30" rx="10" fill="white" />
        <rect x="50" y="115" width="6" height="14" fill="#0f3478" opacity="0.5" />
        <rect x="224" y="115" width="6" height="14" fill="#0f3478" opacity="0.5" />
        <rect x="60" y="55" width="38" height="22" rx="5" fill="#0f3478" opacity="0.15" />
        <rect x="180" y="55" width="38" height="22" rx="5" fill="#0f3478" opacity="0.2" />
      </svg>
      <div className="absolute left-6 bottom-3 w-16 h-3 rounded bg-stone-400/40" />
    </>
  );
}

export default CollectionsPage;
