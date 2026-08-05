"use client";

import {
  Undo2,
  Redo2,
  RotateCcw,
  Pencil,
  DoorOpen,
  AppWindow,
  Search,
  Plus,
  Layers,
  Box,
  FileText,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import {
  RoomDesignerHost,
  SUGAR_PRODUCT_MIME,
  type SugarRoomDesignerElement,
} from "@/components/RoomDesignerHost";
import { QuoteOfferSheet } from "@/components/offers/QuoteOfferSheet";
import {
  useCatalogProductSearch,
  useInfiniteScroll,
  getProductById,
  type CatalogProduct,
  type CatalogProductDetail,
} from "@/lib/catalog";
import {
  lineFromCatalogProduct,
  formatConfigNote,
  getOfferById,
  resolveOfferSceneLayout,
  type QuoteDraft,
  type QuoteLineItem,
  type QuoteVariantSelection,
} from "@/lib/offers";
import { PortalCrmError } from "@/lib/portal-crm";
import { InfiniteScrollSentinel } from "@/components/InfiniteScrollSentinel";
import { ProductSearchFilterMenu } from "@/components/catalog/ProductSearchFilterMenu";
import { defaultLocale, isAppLocale, toBcp47 } from "@/i18n/config";

type TemplateKey = "kare" | "L" | "U" | "T";

type SceneExport = {
  products?: Array<{ id?: number; name?: string }>;
  productInstances?: Array<{
    model?: number;
    stateUuid?: string;
  }>;
  stateSlices?: Record<
    string,
    {
      kind?: string;
      value?: {
        partMaterials?: Array<{ code?: string; materialId?: string | number }>;
      };
    }
  >;
};

/** Room designer Api.fetchProduct expects numeric Sugar productModalId. */
function resolveSugarProductId(product: CatalogProduct): number | null {
  const raw = product.productModalId?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function configSignature(selections: QuoteVariantSelection[]): string {
  return selections
    .map((s) => `${s.optionName}=${s.valuePathName || s.valueName}`)
    .join("|");
}

function partMaterialsToSelections(
  partMaterials: Array<{ code?: string; materialId?: string | number }> | undefined,
): QuoteVariantSelection[] {
  if (!partMaterials?.length) return [];
  return partMaterials
    .filter((pm) => pm.code || pm.materialId != null)
    .map((pm, index) => ({
      optionName: pm.code || `Part ${index + 1}`,
      valueName: String(pm.materialId ?? ""),
      valuePathName: pm.code,
      displayOrder: index + 1,
    }));
}

function OdaPage() {
  const t = useTranslations("oda");
  const tOffers = useTranslations("offers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const language = isAppLocale(locale) ? locale : defaultLocale;
  const bcp47 = toBcp47(language);
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() || null;
  const [designerEl, setDesignerEl] = useState<SugarRoomDesignerElement | null>(
    null,
  );
  const designerRef = useRef<SugarRoomDesignerElement | null>(null);
  const offerImportDoneRef = useRef<string | null>(null);
  const catalogBySugarIdRef = useRef<Map<number, CatalogProduct>>(new Map());
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const [template, setTemplate] = useState<TemplateKey>("kare");
  const [addingOpening, setAddingOpening] = useState<null | "kapi" | "pencere">(
    null,
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [query, setQuery] = useState("");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [productScrollEl, setProductScrollEl] = useState<HTMLDivElement | null>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [offerHeaderTitle, setOfferHeaderTitle] = useState<string | null>(null);
  const [offerBanner, setOfferBanner] = useState<string | null>(null);
  const [offerImporting, setOfferImporting] = useState(false);
  const {
    products,
    loading: productsLoading,
    loadingMore: productsLoadingMore,
    hasMore: productsHasMore,
    loadMore: loadMoreProducts,
    facetFilters,
    hasActiveFacets,
    activeFacetCount,
    toggleFacetOption,
    clearFacets,
    isOptionSelected,
  } = useCatalogProductSearch({ query, size: 40 });

  const { sentinelRef: productSentinelRef } = useInfiniteScroll({
    hasMore: productsHasMore,
    loading: productsLoading || productsLoadingMore,
    onLoadMore: loadMoreProducts,
    root: productScrollEl,
  });

  const templateLabels = useMemo(
    (): Record<TemplateKey, string> => ({
      kare: t("templateSquare"),
      L: t("templateL"),
      U: t("templateU"),
      T: t("templateT"),
    }),
    [t],
  );

  const productsByCollection = useMemo(() => {
    const otherLabel = tCommon("other");
    const map: Record<string, CatalogProduct[]> = {};
    for (const p of products) {
      const key = p.collectionName || otherLabel;
      (map[key] ||= []).push(p);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, bcp47));
  }, [products, tCommon, bcp47]);

  const facetLabel = useCallback(
    (field: string) => {
      if (field === "catalogs") return t("facetCatalogs");
      if (field === "typeCategories" || field === "categories") return t("facetCategories");
      if (field === "collections") return t("facetCollections");
      return field;
    },
    [t],
  );

  const onDesignerReady = useCallback((el: SugarRoomDesignerElement) => {
    designerRef.current = el;
    setDesignerEl(el);
  }, []);

  useEffect(() => {
    const el = designerEl;
    if (!el) return;

    const onRenderMode = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      setMode(detail === "3d" ? "3D" : "2D");
    };
    const onHistory = (e: Event) => {
      const detail = (e as CustomEvent<{ canUndo: boolean; canRedo: boolean }>)
        .detail;
      setCanUndo(!!detail?.canUndo);
      setCanRedo(!!detail?.canRedo);
    };
    const onDrawer = (e: Event) => {
      const state = (e as CustomEvent<string>).detail;
      if (state === "door") setAddingOpening("kapi");
      else if (state === "window") setAddingOpening("pencere");
      else setAddingOpening(null);
    };

    el.addEventListener("render-mode-changed", onRenderMode);
    el.addEventListener("history-changed", onHistory);
    el.addEventListener("drawer-state", onDrawer);

    const unsubHistory = el.api?.store("history").subscribe((h) => {
      const hist = h as { canUndo?: boolean; canRedo?: boolean };
      setCanUndo(!!hist?.canUndo);
      setCanRedo(!!hist?.canRedo);
    });

    return () => {
      el.removeEventListener("render-mode-changed", onRenderMode);
      el.removeEventListener("history-changed", onHistory);
      el.removeEventListener("drawer-state", onDrawer);
      unsubHistory?.();
    };
  }, [designerEl]);

  useEffect(() => {
    if (!offerId) {
      setOfferHeaderTitle(null);
      setOfferBanner(null);
      offerImportDoneRef.current = null;
      return;
    }
    if (!designerEl?.api) return;
    if (offerImportDoneRef.current === offerId) return;

    let cancelled = false;
    void (async () => {
      setOfferImporting(true);
      setOfferBanner(null);
      try {
        const offer = await getOfferById(offerId, router);
        if (cancelled) return;
        const title =
          offer.title?.trim() ||
          (offer.offerNumber ? `#${offer.offerNumber}` : null);
        setOfferHeaderTitle(title);
        const raw = resolveOfferSceneLayout(offer);
        if (!raw) {
          setOfferBanner(t("offerSceneMissing"));
          offerImportDoneRef.current = offerId;
          return;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          setOfferBanner(t("offerSceneImportError"));
          offerImportDoneRef.current = offerId;
          return;
        }
        await designerEl.api!.execute("scene.import", parsed);
        if (!cancelled) {
          offerImportDoneRef.current = offerId;
        }
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setOfferBanner(
            err instanceof Error ? err.message : t("offerLoadError"),
          );
          offerImportDoneRef.current = offerId;
        }
      } finally {
        if (!cancelled) setOfferImporting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [designerEl, offerId, router, t]);

  const withDesigner = (fn: (el: SugarRoomDesignerElement) => void) => {
    const el = designerRef.current;
    if (el) fn(el);
  };

  const setViewMode = (next: "2D" | "3D") => {
    setMode(next);
    withDesigner((el) => el.setRenderMode(next === "2D" ? "2d" : "3d"));
  };

  const applyTemplate = (t: TemplateKey) => {
    setTemplate(t);
    withDesigner((el) => el.applyRoomShape(t));
  };

  const toggleOpening = (kind: "kapi" | "pencere") => {
    const next = addingOpening === kind ? null : kind;
    setAddingOpening(next);
    withDesigner((el) => {
      if (next === "kapi") el.setTool("door");
      else if (next === "pencere") el.setTool("window");
      else el.setTool("select");
    });
  };

  const addProduct = (product: CatalogProduct) => {
    const sugarId = resolveSugarProductId(product);
    if (sugarId == null) {
      console.warn("[oda] product has no productModalId", product.id, product.name);
      return;
    }
    catalogBySugarIdRef.current.set(sugarId, product);
    withDesigner((el) => {
      void el.addProduct(sugarId).catch((err) => {
        console.error("[oda] addProduct failed", err);
      });
    });
  };

  const onProductDragStart = (
    event: React.DragEvent,
    product: CatalogProduct,
  ) => {
    const sugarId = resolveSugarProductId(product);
    if (sugarId == null) {
      event.preventDefault();
      return;
    }
    catalogBySugarIdRef.current.set(sugarId, product);
    const payload = { productId: sugarId };
    event.dataTransfer.setData(SUGAR_PRODUCT_MIME, JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", String(sugarId));
    event.dataTransfer.effectAllowed = "copy";
    withDesigner((el) => el.beginProductDrag(payload));
  };

  const onProductDragEnd = () => {
    withDesigner((el) => el.cancelProductDrag());
  };

  const openQuoteFromScene = useCallback(async () => {
    const el = designerRef.current;
    if (!el?.api) return;
    setQuoteBusy(true);
    try {
      const scene = el.api.execute("scene.export", undefined) as SceneExport;
      const instances = scene.productInstances ?? [];
      if (instances.length === 0) {
        setQuoteBusy(false);
        return;
      }

      type Acc = {
        sugarId: number;
        name: string;
        quantity: number;
        variantSelections: QuoteVariantSelection[];
      };
      const grouped = new Map<string, Acc>();

      for (const inst of instances) {
        const sugarId = Number(inst.model);
        if (!Number.isFinite(sugarId)) continue;
        const productMeta = scene.products?.find((p) => p.id === sugarId);
        const slice = inst.stateUuid ? scene.stateSlices?.[inst.stateUuid] : undefined;
        const variantSelections = partMaterialsToSelections(
          slice?.kind === "sugarModel" ? slice.value?.partMaterials : undefined,
        );
        const key = `${sugarId}::${configSignature(variantSelections)}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.quantity += 1;
        } else {
          grouped.set(key, {
            sugarId,
            name: productMeta?.name || `Product ${sugarId}`,
            quantity: 1,
            variantSelections,
          });
        }
      }

      const lines: QuoteLineItem[] = [];
      for (const row of grouped.values()) {
        const cached = catalogBySugarIdRef.current.get(row.sugarId);
        let catalogId = cached?.id;
        let detailName = cached?.name || row.name;
        let prices: CatalogProductDetail["prices"] = [];
        let sku: string | null = null;
        let thumbnailUrl: string | null = cached?.thumbnailUrl ?? null;

        if (catalogId) {
          try {
            const detail = await getProductById(catalogId, router);
            detailName = detail.name;
            prices = detail.prices;
            sku = detail.sku ?? null;
            thumbnailUrl = detail.thumbnailUrl ?? thumbnailUrl;
          } catch {
            // keep cached / scene name
          }
        } else {
          console.warn("[oda] missing CRM product for sugar id", row.sugarId);
          continue;
        }

        const note = formatConfigNote(row.variantSelections);
        lines.push(
          lineFromCatalogProduct(
            {
              id: catalogId,
              name: detailName,
              sku,
              thumbnailUrl,
              prices: prices ?? [],
            },
            {
              quantity: row.quantity,
              currency: "TRY",
              note: note || null,
              variantSelections: row.variantSelections,
            },
          ),
        );
      }

      if (lines.length === 0) {
        setQuoteBusy(false);
        return;
      }

      setQuoteDraft({
        title: t("headerTitle"),
        currency: "TRY",
        language,
        section: {
          name: "Oda",
          sceneLayout: JSON.stringify(scene),
        },
        lines,
      });
      setQuoteOpen(true);
    } finally {
      setQuoteBusy(false);
    }
  }, [language, router, t]);

  return (
    <div className="h-dvh bg-[color:var(--istikbal-bg)] flex flex-col overflow-hidden">
      <AppHeader
        title={(offerHeaderTitle || t("headerTitle")).toUpperCase()}
        backHref={offerId ? "/teklifler" : "/"}
        actions={
          <button
            type="button"
            disabled={quoteBusy || !designerEl}
            onClick={() => void openQuoteFromScene()}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[color:var(--istikbal-blue)] text-white text-xs font-bold hover:bg-[color:var(--istikbal-navy)] disabled:opacity-40"
          >
            {quoteBusy ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            {tOffers("createQuote")}
          </button>
        }
      />

      {(offerImporting || offerBanner) && (
        <div className="px-4 lg:px-8 pt-3">
          {offerImporting && (
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[color:var(--istikbal-blue)]/70 shadow-sm">
              <Loader2 className="size-3.5 animate-spin" />
              {tOffers("listTitle")}…
            </div>
          )}
          {!offerImporting && offerBanner && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              {offerBanner}
            </div>
          )}
        </div>
      )}

      <main className="flex-1 min-h-0 px-4 lg:px-8 py-4 lg:py-6 grid grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden">
        <aside className="col-span-12 lg:col-span-2 space-y-3 overflow-y-auto min-h-0 lg:h-full">
          <div className="bg-white rounded-2xl p-2 shadow-sm">
            <div className="relative flex rounded-xl bg-[color:var(--istikbal-bg)] p-1">
              <div
                className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-[color:var(--istikbal-blue)] transition-all duration-300 ease-out ${
                  mode === "2D" ? "left-1" : "left-[calc(50%+2px)]"
                }`}
              />
              <button
                onClick={() => setViewMode("2D")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-colors duration-300 ${
                  mode === "2D"
                    ? "text-white"
                    : "text-[color:var(--istikbal-blue)]/70 hover:text-[color:var(--istikbal-blue)]"
                }`}
              >
                <Layers className="size-4" />
                {t("view2d")}
              </button>
              <button
                onClick={() => setViewMode("3D")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold transition-colors duration-300 ${
                  mode === "3D"
                    ? "text-white"
                    : "text-[color:var(--istikbal-blue)]/70 hover:text-[color:var(--istikbal-blue)]"
                }`}
              >
                <Box className="size-4" />
                {t("view3d")}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-2 grid grid-cols-2 gap-1 shadow-sm">
            <button
              disabled={!canUndo}
              onClick={() => withDesigner((el) => el.undo())}
              className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[color:var(--istikbal-blue)] ${
                canUndo ? "hover:bg-black/5" : "opacity-30"
              }`}
              title={t("undoTitle")}
            >
              <Undo2 className="size-4" />
              <span className="text-[10px] font-semibold">{t("undo")}</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={() => withDesigner((el) => el.redo())}
              className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[color:var(--istikbal-blue)] ${
                canRedo ? "hover:bg-black/5" : "opacity-30"
              }`}
              title={t("redoTitle")}
            >
              <Redo2 className="size-4" />
              <span className="text-[10px] font-semibold">{t("redo")}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-2 grid grid-cols-2 gap-1 shadow-sm">
            <button
              onClick={() => withDesigner((el) => void el.newScene())}
              className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-[color:var(--istikbal-blue)] hover:bg-black/5"
              title={t("resetTitle")}
            >
              <RotateCcw className="size-4" />
              <span className="text-[10px] font-bold">{t("reset")}</span>
            </button>
            <button
              onClick={() =>
                withDesigner((el) => {
                  void el.newScene().then(() => el.setTool("draw"));
                })
              }
              className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-rose-600 hover:bg-rose-50"
              title={t("drawFromScratchTitle")}
            >
              <Pencil className="size-4" />
              <span className="text-[10px] font-bold">{t("drawFromScratch")}</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2">
              {t("templates")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(templateLabels) as TemplateKey[]).map((key) => (
                <button
                  key={key}
                  onClick={() => applyTemplate(key)}
                  className={`aspect-square rounded-xl border-2 transition flex flex-col items-center justify-center gap-1 p-2 ${
                    template === key
                      ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue)]/5"
                      : "border-black/5 hover:border-black/20"
                  }`}
                >
                  <TemplateIcon kind={key} active={template === key} />
                  <span className="text-[10px] font-semibold text-[color:var(--istikbal-blue)]">
                    {templateLabels[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2">
              {t("openings")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggleOpening("kapi")}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  addingOpening === "kapi"
                    ? "border-[color:var(--istikbal-yellow)] bg-[color:var(--istikbal-yellow)]/10 text-[color:var(--istikbal-blue)]"
                    : "border-black/5 hover:border-black/20 text-[color:var(--istikbal-blue)]"
                }`}
              >
                <DoorOpen className="size-4" /> {t("door")}
              </button>
              <button
                onClick={() => toggleOpening("pencere")}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  addingOpening === "pencere"
                    ? "border-[color:var(--istikbal-yellow)] bg-[color:var(--istikbal-yellow)]/10 text-[color:var(--istikbal-blue)]"
                    : "border-black/5 hover:border-black/20 text-[color:var(--istikbal-blue)]"
                }`}
              >
                <AppWindow className="size-4" /> {t("window")}
              </button>
            </div>
            {addingOpening && (
              <p className="mt-2 text-[10px] text-[color:var(--istikbal-blue)]/60">
                {t("clickWallHint")}
              </p>
            )}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-7 min-h-[520px] lg:min-h-0 lg:h-full">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden relative h-full min-h-[520px] lg:min-h-0">
            <RoomDesignerHost
              className="absolute inset-0 h-full w-full"
              ui="none"
              onReady={onDesignerReady}
            />
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 flex flex-col min-h-0 lg:h-full">
          <div className="bg-white rounded-2xl p-3 shadow-sm flex flex-col min-h-0 flex-1">
            <div className="relative mb-3 shrink-0 flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("searchProductsPlaceholder")}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/5 text-sm placeholder:text-[color:var(--istikbal-blue)]/40 text-[color:var(--istikbal-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--istikbal-blue)]/20"
                />
              </div>
              <ProductSearchFilterMenu
                open={filterMenuOpen}
                onOpenChange={setFilterMenuOpen}
                facetFilters={facetFilters}
                hasActiveFacets={hasActiveFacets}
                activeFacetCount={activeFacetCount}
                facetLabel={facetLabel}
                isOptionSelected={isOptionSelected}
                onToggleOption={toggleFacetOption}
                onClear={clearFacets}
                clearLabel={t("clearFacets")}
                filterAriaLabel={t("filters")}
              />
            </div>
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2 flex items-center justify-between shrink-0">
              <span>{t("productsTitle")}</span>
              <span className="text-[color:var(--istikbal-blue)]/40 normal-case font-medium">
                {products.length}
              </span>
            </h3>
            <div
              ref={setProductScrollEl}
              className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4"
            >
              {productsLoading && products.length === 0 && (
                <p className="text-xs text-[color:var(--istikbal-blue)]/50 text-center py-6">
                  {tCommon("loading")}
                </p>
              )}
              {!productsLoading && productsByCollection.length === 0 && (
                  <div className="text-sm text-[color:var(--istikbal-blue)]/40 text-center py-6">
                    {tCommon("noResults")}
                  </div>
                )}
              {productsByCollection.map(([collection, items]) => (
                <div key={collection}>
                  <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-1 mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[color:var(--istikbal-blue)] uppercase tracking-wider">
                      {collection}
                    </span>
                    <span className="text-[10px] text-[color:var(--istikbal-blue)]/40">
                      {items.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((p) => {
                      const sugarId = resolveSugarProductId(p);
                      const canPlace = sugarId != null;
                      return (
                      <button
                        type="button"
                        key={p.id}
                        title={
                          canPlace
                            ? p.name
                            : t("noModelIdTitle", { name: p.name })
                        }
                        draggable={canPlace}
                        onDragStart={(e) => onProductDragStart(e, p)}
                        onDragEnd={onProductDragEnd}
                        onClick={() => addProduct(p)}
                        disabled={!canPlace}
                        className="group rounded-xl border border-black/5 hover:border-[color:var(--istikbal-blue)]/40 hover:shadow-md transition p-2 text-left bg-white cursor-grab active:cursor-grabbing disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-none"
                      >
                        <div className="aspect-square rounded-lg overflow-hidden bg-stone-100 mb-1.5 relative">
                          {p.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.thumbnailUrl}
                              alt={p.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[color:var(--istikbal-blue)]/20 text-xs">
                              {tCommon("emDash")}
                            </div>
                          )}
                        </div>
                        <div className="text-[11px] font-semibold text-[color:var(--istikbal-blue)] leading-tight line-clamp-2">
                          {p.name}
                        </div>
                        <div className="mt-1 flex items-center justify-end">
                          <Plus className="size-3 text-[color:var(--istikbal-blue)]/40 group-hover:text-[color:var(--istikbal-blue)] shrink-0" />
                        </div>
                      </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <InfiniteScrollSentinel
                sentinelRef={productSentinelRef}
                hasMore={productsHasMore}
                loadingMore={productsLoadingMore}
              />
            </div>
          </div>
        </aside>
      </main>

      <QuoteOfferSheet
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        draft={quoteDraft}
        onDraftChange={setQuoteDraft}
      />
    </div>
  );
}

function TemplateIcon({ kind, active }: { kind: TemplateKey; active: boolean }) {
  const stroke = active ? "var(--istikbal-blue)" : "#9ca3af";
  const fill = active ? "rgba(30,58,138,0.08)" : "transparent";
  const common = { fill, stroke, strokeWidth: 2 };
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      {kind === "kare" && <rect x="6" y="6" width="28" height="28" rx="2" {...common} />}
      {kind === "L" && <path d="M6 6 H34 V22 H22 V34 H6 Z" {...common} />}
      {kind === "U" && <path d="M6 6 H34 V34 H26 V18 H14 V34 H6 Z" {...common} />}
      {kind === "T" && <path d="M6 6 H34 V18 H26 V34 H14 V18 H6 Z" {...common} />}
    </svg>
  );
}

export default function OdaPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[color:var(--istikbal-bg)] text-sm text-[color:var(--istikbal-blue)]/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <OdaPage />
    </Suspense>
  );
}
