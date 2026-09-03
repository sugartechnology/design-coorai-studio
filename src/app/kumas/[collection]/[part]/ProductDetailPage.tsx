"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Box, RotateCw, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { parts, type Part } from "@/lib/kumas-data";
import {
  getCollection,
  getProductById,
  type CatalogProductDetail,
} from "@/lib/catalog";
import { PortalCrmError, getPortalSessionView } from "@/lib/portal-crm";
import {
  ModelViewerHost,
  SUGAR_MODEL_VIEWER_COMPANY_ID,
} from "@/components/ModelViewerHost";
import { AppHeader } from "@/components/AppHeader";
import { useProductZones } from "@/lib/material-zone";
import {
  lineFromCatalogProduct,
  zoneSelectionsToConfig,
  type QuoteDraft,
} from "@/lib/offers";
import { useCart } from "@/lib/cart";
import { QuoteOfferSheet } from "@/components/offers/QuoteOfferSheet";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import { FabricPicker } from "./FabricPicker";
import { FabricRegionsPanel } from "./FabricRegionsPanel";
import { ProductHero } from "./ProductHero";

const DETAIL_GRADIENT = "from-stone-200 via-stone-100 to-emerald-100";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PART: Part = {
  slug: "uclu-koltuk",
  name: "",
  regions: 4,
  silhouette: "uclu",
};

type GalleryItem =
  | { kind: "3d"; key: "3d" }
  | { kind: "image"; key: string; url: string };

function resolveViewerCompanyId(
  product: CatalogProductDetail | null,
  fallback: number | null,
): number {
  const fromRef = product?.rapidRenderRefs?.find(
    (ref) => ref.rrCompanyId != null,
  )?.rrCompanyId;
  const id = Number(fromRef ?? fallback);
  return Number.isFinite(id) && id > 0 ? id : SUGAR_MODEL_VIEWER_COMPANY_ID;
}

function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ collection: string; part: string }>();
  const searchParams = useSearchParams();
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const language = isAppLocale(locale) ? locale : defaultLocale;
  const collectionId = params.collection;
  const partParam = params.part;
  const fromCategory = searchParams.get("kategori");

  const mockPart = parts.find((x) => x.slug === partParam) ?? null;
  const isProductId = UUID_RE.test(partParam);

  const [collectionName, setCollectionName] = useState(tCommon("collectionFallback"));
  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [loading, setLoading] = useState(isProductId);
  const [error, setError] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const { addLines } = useCart();
  const [cartFlash, setCartFlash] = useState(false);
  const [sessionRrCompanyId, setSessionRrCompanyId] = useState<number | null>(
    null,
  );

  const part: Part | null =
    mockPart ??
    (isProductId || product
      ? { ...DEFAULT_PART, name: tCommon("productFallback") }
      : null);

  const sugarProductId = product?.productModalId?.trim() || null;
  const stockCode = product?.sku?.trim() || undefined;
  const viewerCompanyId = resolveViewerCompanyId(product, sessionRrCompanyId);
  const has3d = Boolean(sugarProductId);

  const {
    areas,
    loading: zonesLoading,
    error: zonesError,
    selectedCodes,
    selectionByArea,
    allSelected,
    pickerArea,
    setPickerAreaName,
    onViewerReady,
    pickOption,
    sku: zoneSku,
    guideImage,
  } = useProductZones({
    sugarProductId,
    stockCode,
    companyId: viewerCompanyId,
    fallbackError: t("zonesError"),
  });

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    const urls = [
      ...(product.images ?? []).map((img) => img.url || img.thumbnailUrl),
      product.thumbnailUrl,
    ].filter((url): url is string => Boolean(url));
    return Array.from(new Set(urls));
  }, [product]);

  const galleryItems = useMemo((): GalleryItem[] => {
    const images: GalleryItem[] = galleryImages.map((url) => ({
      kind: "image",
      key: url,
      url,
    }));
    if (has3d) return [{ kind: "3d", key: "3d" }, ...images];
    return images;
  }, [galleryImages, has3d]);

  useEffect(() => {
    setActiveGalleryIndex(has3d && galleryImages.length > 0 ? 1 : 0);
  }, [product?.id, has3d, galleryImages.length]);

  useEffect(() => {
    let cancelled = false;
    void getPortalSessionView().then((session) => {
      if (cancelled) return;
      const rr = session?.rrCompanyId;
      setSessionRrCompanyId(
        typeof rr === "number" && Number.isFinite(rr) ? rr : null,
      );
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (isProductId) {
        setLoading(true);
        setError(null);
        try {
          const data = await getProductById(partParam, router);
          if (cancelled) return;
          setProduct(data);
          if (data.collectionName) setCollectionName(data.collectionName);
        } catch (err) {
          if (err instanceof PortalCrmError && err.status === 401) return;
          if (!cancelled) {
            setError(
              err instanceof Error ? err.message : tCatalog("productLoadError"),
            );
            setProduct(null);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      }

      if (!collectionId || collectionId === "_" || collectionId === "koleksiyon") {
        return;
      }
      try {
        const data = await getCollection(collectionId, router);
        if (!cancelled && data?.name) setCollectionName(data.name);
      } catch {
        // Keep name from product or placeholder.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId, isProductId, partParam, router, tCatalog]);

  if (!isProductId && !mockPart) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {t("productNotFound")}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-black/5 py-12 flex flex-col items-center gap-3 text-[color:var(--brand-primary)]/60">
        <Loader2 className="size-8 animate-spin" />
        <p className="text-sm font-semibold">{t("productsLoading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!part) return null;

  const productTitle =
    product?.name ??
    `${collectionName.replace(" Koltuk Takımı", "")} ${part.name}`;
  const safeGalleryIndex = galleryItems.length
    ? Math.min(activeGalleryIndex, galleryItems.length - 1)
    : 0;
  const activeItem = galleryItems[safeGalleryIndex] ?? null;
  const is3dActive = activeItem?.kind === "3d";
  const heroImage =
    activeItem?.kind === "image" ? activeItem.url : galleryImages[0] ?? null;

  const backHref = fromCategory
    ? `/kumas/kategori/${fromCategory}`
    : product?.categoryId
      ? `/kumas/kategori/${product.categoryId}`
      : collectionId && collectionId !== "_"
        ? `/kumas/${collectionId}`
        : "/kumas";

  const cycleGallery = () => {
    if (galleryItems.length < 2) return;
    setActiveGalleryIndex((i) => (i + 1) % galleryItems.length);
  };

  const showInHome = () => {
    if (!has3d) return;
    const threeDIndex = galleryItems.findIndex((item) => item.kind === "3d");
    if (threeDIndex >= 0) setActiveGalleryIndex(threeDIndex);
  };

  return (
    <>
      <AppHeader
        title={(product?.name || part?.name || tCommon("productFallback")).toUpperCase()}
        backHref={backHref}
      />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 lg:px-10 py-4 lg:py-6 lg:overflow-hidden">
      <div className="flex min-h-full flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:overflow-hidden">
        <div className="flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm lg:h-full lg:min-h-0">
          <div
            className={`relative min-h-[280px] flex-1 bg-gradient-to-br ${DETAIL_GRADIENT} grid place-items-center`}
          >
            {sugarProductId && (
              <ModelViewerHost
                key={`${sugarProductId}:${viewerCompanyId}:${stockCode ?? ""}`}
                sugarProductId={sugarProductId}
                stockCode={stockCode}
                companyId={viewerCompanyId}
                materialUi="host"
                ar
                onElementReady={onViewerReady}
                className={`absolute inset-0 z-[1] h-full w-full transition-opacity ${
                  is3dActive
                    ? "opacity-100"
                    : "pointer-events-none opacity-0"
                }`}
              />
            )}
            {!is3dActive &&
              (heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={heroImage}
                  alt={productTitle}
                  className="absolute inset-0 z-0 h-full w-full object-contain p-6"
                />
              ) : (
                <ProductHero
                  part={part.silhouette}
                  view={safeGalleryIndex % 3}
                  areas={areas}
                  selection={selectionByArea}
                />
              ))}

            {has3d && !is3dActive && (
              <button
                type="button"
                onClick={showInHome}
                className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[color:var(--brand-primary)] text-white font-semibold text-sm shadow-lg hover:bg-[color:var(--brand-primary-strong)] transition-colors"
              >
                <Box className="size-4" /> {t("seeInYourHome")}
              </button>
            )}
            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={cycleGallery}
                className="absolute top-5 right-5 z-10 size-10 grid place-items-center rounded-full bg-white/80 hover:bg-white text-[color:var(--brand-primary)] shadow-sm"
                title={t("nextImageTitle")}
              >
                <RotateCw className="size-4" />
              </button>
            )}
          </div>

          {galleryItems.length > 0 && (
            <div className="flex shrink-0 gap-3 overflow-x-auto border-t border-black/5 p-4">
              {galleryItems.map((item, i) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActiveGalleryIndex(i)}
                  className={`relative h-16 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                    safeGalleryIndex === i
                      ? "border-[color:var(--brand-accent)] ring-2 ring-[color:var(--brand-accent)]/30"
                      : "border-transparent hover:border-[color:var(--brand-primary)]/20"
                  }`}
                >
                  {item.kind === "3d" ? (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[color:var(--brand-primary)]/5 text-[color:var(--brand-primary)]">
                      <Box className="size-5" />
                      <span className="text-[10px] font-bold tracking-wide">
                        {t("gallery3d")}
                      </span>
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="flex min-h-0 flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:h-full lg:overflow-hidden">
          <div className="mb-4 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-primary)]/45">
              {[product?.categoryName, collectionName].filter(Boolean).join(" · ") ||
                collectionName}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[color:var(--brand-primary)] leading-tight">
              {productTitle}
            </h2>
            {(zoneSku || product?.sku) && (
              <p className="mt-1 text-xs text-[color:var(--brand-primary)]/50">
                {t("skuLabel", { sku: zoneSku || product?.sku || "" })}
              </p>
            )}
          </div>

          <FabricRegionsPanel
            areas={areas}
            selectionByArea={selectionByArea}
            loading={zonesLoading}
            error={zonesError}
            allSelected={allSelected}
            sku={zoneSku}
            guideImage={guideImage}
            companyId={viewerCompanyId}
            onOpenPicker={setPickerAreaName}
            onAddToCart={() => {
              if (!product) return;
              const { variantSelections, note } = zoneSelectionsToConfig(
                areas,
                selectionByArea,
                (n) => t("regionLabel", { n }),
              );
              const line = lineFromCatalogProduct(product, {
                currency: "TRY",
                note,
                variantSelections,
              });
              addLines(
                [line],
                "kumas",
                {
                  name: product.name,
                  images: guideImage
                    ? [
                        {
                          imageUrl: guideImage,
                          imageOrder: 0,
                          altText: t("zoneGuideAlt"),
                        },
                      ]
                    : [],
                },
              );
              setCartFlash(true);
              window.setTimeout(() => setCartFlash(false), 1800);
            }}
            onAddToQuote={() => {
              if (!product) return;
              const { variantSelections, note } = zoneSelectionsToConfig(
                areas,
                selectionByArea,
                (n) => t("regionLabel", { n }),
              );
              const line = lineFromCatalogProduct(product, {
                currency: "TRY",
                note,
                variantSelections,
              });
              setQuoteDraft({
                title: product.name,
                currency: line.currency,
                language,
                section: {
                  name: product.name,
                  images: guideImage
                    ? [
                        {
                          imageUrl: guideImage,
                          imageOrder: 0,
                          altText: t("zoneGuideAlt"),
                        },
                      ]
                    : [],
                },
                lines: [line],
              });
              setQuoteOpen(true);
            }}
          />
          {cartFlash ? (
            <p className="mt-2 text-center text-xs font-semibold text-[color:var(--brand-primary)]">
              {tCommon("addedToCart")}
            </p>
          ) : null}
        </aside>

        {pickerArea && (
          <FabricPicker
            area={pickerArea}
            currentCode={selectedCodes[pickerArea.name]}
            onClose={() => setPickerAreaName(null)}
            onPick={(option) => void pickOption(pickerArea, option)}
          />
        )}

        <QuoteOfferSheet
          open={quoteOpen}
          onOpenChange={setQuoteOpen}
          draft={quoteDraft}
          onDraftChange={setQuoteDraft}
        />
      </div>
      </div>
      </div>
    </>
  );
}

export default ProductDetailPage;
