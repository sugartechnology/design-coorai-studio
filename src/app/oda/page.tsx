"use client";

import Link from "next/link";
import {
  ArrowLeft,
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
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  RoomDesignerHost,
  SUGAR_PRODUCT_MIME,
  type SugarRoomDesignerElement,
} from "@/components/RoomDesignerHost";
import { useCatalogFilters, useInfiniteScroll, useProductSearch, type CatalogProduct } from "@/lib/catalog";
import { InfiniteScrollSentinel } from "@/components/InfiniteScrollSentinel";

type TemplateKey = "kare" | "L" | "U" | "T";

const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  kare: "Kare Oda",
  L: "L Oda",
  U: "U Oda",
  T: "T Oda",
};

/** Room designer Api.fetchProduct expects numeric Sugar productModalId. */
function resolveSugarProductId(product: CatalogProduct): number | null {
  const raw = product.productModalId?.trim();
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

function OdaPage() {
  const [designerEl, setDesignerEl] = useState<SugarRoomDesignerElement | null>(
    null,
  );
  const designerRef = useRef<SugarRoomDesignerElement | null>(null);
  const [mode, setMode] = useState<"2D" | "3D">("2D");
  const [template, setTemplate] = useState<TemplateKey>("kare");
  const [addingOpening, setAddingOpening] = useState<null | "kapi" | "pencere">(
    null,
  );
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [query, setQuery] = useState("");
  const [productScrollEl, setProductScrollEl] = useState<HTMLDivElement | null>(null);
  const { collections, loading: filtersLoading } = useCatalogFilters();
  const {
    products,
    loading: productsLoading,
    loadingMore: productsLoadingMore,
    hasMore: productsHasMore,
    loadMore: loadMoreProducts,
  } = useProductSearch({ query, size: 40 });

  const { sentinelRef: productSentinelRef } = useInfiniteScroll({
    hasMore: productsHasMore,
    loading: productsLoading || productsLoadingMore,
    onLoadMore: loadMoreProducts,
    root: productScrollEl,
  });

  const productsByCollection = useMemo(() => {
    const map: Record<string, CatalogProduct[]> = {};
    for (const p of products) {
      const key =
        p.collectionName ||
        collections.find((c) => c.id === p.collectionId)?.name ||
        "Diğer";
      (map[key] ||= []).push(p);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b, "tr"));
  }, [products, collections]);

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
    const payload = { productId: sugarId };
    event.dataTransfer.setData(SUGAR_PRODUCT_MIME, JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", String(sugarId));
    event.dataTransfer.effectAllowed = "copy";
    withDesigner((el) => el.beginProductDrag(payload));
  };

  const onProductDragEnd = () => {
    withDesigner((el) => el.cancelProductDrag());
  };

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)] flex flex-col">
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]"
        >
          <ArrowLeft className="size-4" /> Geri
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">
          ODA PLANLA
        </div>
        <div className="flex-1" />
      </header>

      <main className="flex-1 min-h-0 px-4 lg:px-8 py-6 grid grid-cols-12 gap-4">
        <aside className="col-span-12 lg:col-span-2 space-y-3 overflow-y-auto max-h-[calc(100dvh-5.5rem)]">
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
                2D
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
                3D
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
              title="Geri Al"
            >
              <Undo2 className="size-4" />
              <span className="text-[10px] font-semibold">Geri</span>
            </button>
            <button
              disabled={!canRedo}
              onClick={() => withDesigner((el) => el.redo())}
              className={`h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[color:var(--istikbal-blue)] ${
                canRedo ? "hover:bg-black/5" : "opacity-30"
              }`}
              title="İleri Al"
            >
              <Redo2 className="size-4" />
              <span className="text-[10px] font-semibold">İleri</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-2 grid grid-cols-2 gap-1 shadow-sm">
            <button
              onClick={() => withDesigner((el) => void el.newScene())}
              className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-[color:var(--istikbal-blue)] hover:bg-black/5"
              title="Sıfırla"
            >
              <RotateCcw className="size-4" />
              <span className="text-[10px] font-bold">Sıfırla</span>
            </button>
            <button
              onClick={() =>
                withDesigner((el) => {
                  void el.newScene().then(() => el.setTool("draw"));
                })
              }
              className="h-16 rounded-xl flex flex-col items-center justify-center gap-1 text-rose-600 hover:bg-rose-50"
              title="Sıfırdan Çiz"
            >
              <Pencil className="size-4" />
              <span className="text-[10px] font-bold">Sıfırdan Çiz</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2">
              Şablonlar
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(TEMPLATE_LABELS) as TemplateKey[]).map((t) => (
                <button
                  key={t}
                  onClick={() => applyTemplate(t)}
                  className={`aspect-square rounded-xl border-2 transition flex flex-col items-center justify-center gap-1 p-2 ${
                    template === t
                      ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue)]/5"
                      : "border-black/5 hover:border-black/20"
                  }`}
                >
                  <TemplateIcon kind={t} active={template === t} />
                  <span className="text-[10px] font-semibold text-[color:var(--istikbal-blue)]">
                    {TEMPLATE_LABELS[t]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2">
              Eklentiler
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
                <DoorOpen className="size-4" /> Kapı
              </button>
              <button
                onClick={() => toggleOpening("pencere")}
                className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  addingOpening === "pencere"
                    ? "border-[color:var(--istikbal-yellow)] bg-[color:var(--istikbal-yellow)]/10 text-[color:var(--istikbal-blue)]"
                    : "border-black/5 hover:border-black/20 text-[color:var(--istikbal-blue)]"
                }`}
              >
                <AppWindow className="size-4" /> Pencere
              </button>
            </div>
            {addingOpening && (
              <p className="mt-2 text-[10px] text-[color:var(--istikbal-blue)]/60">
                Duvara tıklayarak ekleyin.
              </p>
            )}
          </div>
        </aside>

        <section className="col-span-12 lg:col-span-7 min-h-[520px] lg:min-h-0 lg:h-[calc(100dvh-5.5rem)]">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden relative h-full min-h-[520px]">
            <RoomDesignerHost
              className="absolute inset-0 h-full w-full"
              ui="none"
              onReady={onDesignerReady}
            />
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-3 space-y-3 overflow-y-auto max-h-[calc(100dvh-5.5rem)]">
          <div className="bg-white rounded-2xl p-3 shadow-sm">
            <div className="relative mb-3">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ürün ara..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/5 text-sm placeholder:text-[color:var(--istikbal-blue)]/40 text-[color:var(--istikbal-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--istikbal-blue)]/20"
              />
            </div>
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Ürünler · Koleksiyona Göre</span>
              <span className="text-[color:var(--istikbal-blue)]/40 normal-case font-medium">
                {products.length}
              </span>
            </h3>
            <div
              ref={setProductScrollEl}
              className="max-h-[620px] overflow-y-auto pr-1 space-y-4"
            >
              {(filtersLoading || (productsLoading && products.length === 0)) && (
                <p className="text-xs text-[color:var(--istikbal-blue)]/50 text-center py-6">
                  Yükleniyor…
                </p>
              )}
              {!filtersLoading &&
                !productsLoading &&
                productsByCollection.length === 0 && (
                  <div className="text-sm text-[color:var(--istikbal-blue)]/40 text-center py-6">
                    Sonuç bulunamadı.
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
                            : `${p.name} (oda yerleşimi için model id yok)`
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
                              —
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

export default OdaPage;
