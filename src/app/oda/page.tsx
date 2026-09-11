"use client";

import { FileText, Loader2, ShoppingCart } from "lucide-react";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { AppHeader } from "@/components/AppHeader";
import {
  RoomDesignerHost,
  type SugarRoomDesignerElement,
} from "@/components/RoomDesignerHost";
import { QuoteOfferSheet } from "@/components/offers/QuoteOfferSheet";
import { useCart } from "@/lib/cart";
import {
  getProductById,
  type CatalogProduct,
  type CatalogProductDetail,
} from "@/lib/catalog";
import {
  lineFromCatalogProduct,
  formatConfigNote,
  getOfferById,
  resolveOfferSceneLayout,
  applyOfferSceneToDesigner,
  clearRoomDesignerLastScene,
  type QuoteDraft,
  type QuoteLineItem,
  type QuoteVariantSelection,
} from "@/lib/offers";
import { PortalCrmError } from "@/lib/portal-crm";
import { defaultLocale, isAppLocale } from "@/i18n/config";

const AUTHORIZED_PRODUCT_PLACED_EVENT = "authorized-product-placed";

type AuthorizedProductPlacedDetail = {
  sugarId: number;
  catalogId: string;
  name: string;
  thumbnailUrl: string | null;
};

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const offerId = searchParams.get("offerId")?.trim() || null;
  // Clear before CE mount so controller last-scene restore is a no-op.
  if (offerId) clearRoomDesignerLastScene();
  const [designerEl, setDesignerEl] = useState<SugarRoomDesignerElement | null>(
    null,
  );
  const designerRef = useRef<SugarRoomDesignerElement | null>(null);
  const offerImportDoneRef = useRef<{
    offerId: string;
    designer: SugarRoomDesignerElement;
  } | null>(null);
  const catalogBySugarIdRef = useRef<Map<number, CatalogProduct>>(new Map());
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);
  const [cartFlash, setCartFlash] = useState(false);
  const { addLines } = useCart();
  const [offerHeaderTitle, setOfferHeaderTitle] = useState<string | null>(null);
  const [offerBanner, setOfferBanner] = useState<string | null>(null);
  const [offerImporting, setOfferImporting] = useState(false);

  const onDesignerReady = useCallback((el: SugarRoomDesignerElement) => {
    designerRef.current = el;
    setDesignerEl(el);
  }, []);

  useEffect(() => {
    const el = designerEl;
    if (!el) return;

    const onPlaced = (event: Event) => {
      const detail = (event as CustomEvent<AuthorizedProductPlacedDetail>).detail;
      if (!detail?.sugarId || !detail.catalogId) return;
      catalogBySugarIdRef.current.set(detail.sugarId, {
        id: detail.catalogId,
        name: detail.name,
        productModalId: String(detail.sugarId),
        thumbnailUrl: detail.thumbnailUrl,
      });
    };

    el.addEventListener(AUTHORIZED_PRODUCT_PLACED_EVENT, onPlaced);
    return () => {
      el.removeEventListener(AUTHORIZED_PRODUCT_PLACED_EVENT, onPlaced);
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
    const already =
      offerImportDoneRef.current?.offerId === offerId &&
      offerImportDoneRef.current?.designer === designerEl;
    if (already) return;

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
          offerImportDoneRef.current = { offerId, designer: designerEl };
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          setOfferBanner(t("offerSceneImportError"));
          offerImportDoneRef.current = { offerId, designer: designerEl };
          return;
        }

        await applyOfferSceneToDesigner(designerEl, parsed);
        if (!cancelled) {
          offerImportDoneRef.current = { offerId, designer: designerEl };
        }
      } catch (err) {
        console.error("[oda] offer scene restore failed", err);
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setOfferBanner(
            err instanceof Error ? err.message : t("offerLoadError"),
          );
          offerImportDoneRef.current = { offerId, designer: designerEl };
        }
      } finally {
        if (!cancelled) setOfferImporting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [designerEl, offerId, router, t]);

  const buildQuoteFromScene = useCallback(async (): Promise<QuoteDraft | null> => {
    const el = designerRef.current;
    if (!el?.api) return null;
    const scene = el.api.execute("scene.export", undefined) as SceneExport;
    const instances = scene.productInstances ?? [];
    if (instances.length === 0) return null;

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

    if (lines.length === 0) return null;

    return {
      title: t("headerTitle"),
      currency: "TRY",
      language,
      section: {
        name: "Oda",
        sceneLayout: JSON.stringify(scene),
      },
      lines,
    };
  }, [language, router, t]);

  const openQuoteFromScene = useCallback(async () => {
    setQuoteBusy(true);
    try {
      const draft = await buildQuoteFromScene();
      if (!draft) return;
      setQuoteDraft(draft);
      setQuoteOpen(true);
    } finally {
      setQuoteBusy(false);
    }
  }, [buildQuoteFromScene]);

  const addSceneToCart = useCallback(async () => {
    setQuoteBusy(true);
    try {
      const draft = await buildQuoteFromScene();
      if (!draft) return;
      addLines(draft.lines, "oda", draft.section);
      setCartFlash(true);
      window.setTimeout(() => setCartFlash(false), 1800);
    } finally {
      setQuoteBusy(false);
    }
  }, [addLines, buildQuoteFromScene]);

  return (
    <div className="h-dvh bg-[color:var(--brand-bg)] flex flex-col overflow-hidden">
      <AppHeader
        title={(offerHeaderTitle || t("headerTitle")).toUpperCase()}
        backHref={offerId ? "/teklifler" : "/"}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={quoteBusy || !designerEl}
              onClick={() => void addSceneToCart()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-[color:var(--brand-primary)] text-white text-xs font-bold hover:bg-[color:var(--brand-primary-strong)] disabled:opacity-40"
            >
              {quoteBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <ShoppingCart className="size-3.5" />
              )}
              {tCommon("addToCart")}
            </button>
            <button
              type="button"
              disabled={quoteBusy || !designerEl}
              onClick={() => void openQuoteFromScene()}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full border border-[color:var(--brand-primary)]/20 bg-white text-[color:var(--brand-primary)] text-xs font-bold hover:bg-[color:var(--brand-primary)]/5 disabled:opacity-40"
            >
              {quoteBusy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <FileText className="size-3.5" />
              )}
              {tOffers("createQuote")}
            </button>
          </div>
        }
      />

      {cartFlash && (
        <div className="px-4 lg:px-8 pt-2">
          <p className="text-xs font-semibold text-[color:var(--brand-primary)]">
            {tCommon("addedToCart")}
          </p>
        </div>
      )}

      {(offerImporting || offerBanner) && (
        <div className="px-4 lg:px-8 pt-3">
          {offerImporting && (
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[color:var(--brand-primary)]/70 shadow-sm">
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

      <main className="flex-1 min-h-0 px-4 lg:px-8 py-4 lg:py-6 overflow-hidden">
        <section className="h-full min-h-[520px] relative">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden relative h-full min-h-[520px]">
            <RoomDesignerHost
              className="absolute inset-0 h-full w-full"
              authorizedProductMenu
              clearLastSceneOnMount={Boolean(offerId)}
              onReady={onDesignerReady}
            />
          </div>
        </section>
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

export default function OdaPageRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-[color:var(--brand-bg)] text-sm text-[color:var(--brand-primary)]/50">
          <Loader2 className="size-6 animate-spin" />
        </div>
      }
    >
      <OdaPage />
    </Suspense>
  );
}
