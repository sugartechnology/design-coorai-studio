"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ArrowUpDown,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import {
  listProductFilterCategories,
  type CatalogCategory,
} from "@/lib/catalog";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";
import { defaultLocale, isAppLocale, toBcp47 } from "@/i18n/config";

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
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const bcp47 = toBcp47(isAppLocale(locale) ? locale : defaultLocale);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
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
        if (!cancelled) setCategories(cats);
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : tCatalog("categoriesLoadError"));
          setCategories([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, tCatalog]);

  const filtered = useMemo(() => {
    let list = [...categories];
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name, bcp47));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name, bcp47));
        break;
      default:
        break;
    }
    return list;
  }, [categories, debouncedQuery, sort, bcp47]);

  return (
    <>
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            {t("categoriesTitle")}
          </h1>
          <p className="mt-1.5 text-[color:var(--istikbal-blue)]/60">
            {loading
              ? t("categoriesLoading")
              : t("categoriesCountHint", { count: filtered.length })}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchCategoryPlaceholder")}
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
              <option value="default">{tCommon("defaultSort")}</option>
              <option value="name-asc">{tCommon("nameAsc")}</option>
              <option value="name-desc">{tCommon("nameDesc")}</option>
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
          <p className="text-sm font-semibold">{t("categoriesLoading")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white border border-dashed border-black/10 py-20 text-center text-[color:var(--istikbal-blue)]/60">
          {t("emptyCategories")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const { gradient, accent } = gradientFor(c.id);
            return (
              <Link
                key={c.id}
                href={`/kumas/kategori/${c.id}`}
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
                    <CategoryPlaceholder accent={accent} />
                  )}
                </div>

                <div className="px-5 py-5 text-center">
                  <div className="mx-auto mb-2 size-8 rounded-full bg-[color:var(--istikbal-blue-soft)] flex items-center justify-center text-[color:var(--istikbal-blue)]/50">
                    <FolderOpen className="size-4" />
                  </div>
                  <h3 className="text-base font-bold text-[color:var(--istikbal-blue)]">{c.name}</h3>
                  {c.productCount != null && (
                    <p className="mt-2 text-xs text-[color:var(--istikbal-blue)]/55">
                      {tCatalog("productCount", { count: c.productCount })}
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

function CategoryPlaceholder({ accent }: { accent: string }) {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-black/5" />
      <div className={`absolute left-1/2 -translate-x-1/2 bottom-8 w-1/2 h-4 rounded-full blur-md ${accent}`} />
      <div className="absolute inset-0 flex items-center justify-center">
        <FolderOpen className="size-16 text-white/50" strokeWidth={1.25} />
      </div>
    </>
  );
}

export default CollectionsPage;
