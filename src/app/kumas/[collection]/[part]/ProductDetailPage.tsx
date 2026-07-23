"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Box,
  ShoppingCart,
  ChevronRight,
  X,
  AlertCircle,
  Check,
  RotateCw,
  Loader2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parts, type Part } from "@/lib/kumas-data";
import {
  getCollection,
  getProductById,
  type CatalogProductDetail,
} from "@/lib/catalog";
import { PortalCrmError } from "@/lib/portal-crm";
import {
  ModelViewerHost,
  SUGAR_MODEL_VIEWER_COMPANY_ID,
} from "@/components/ModelViewerHost";

type Fabric = {
  id: string;
  name: string;
  bg: string;
  warning?: boolean;
};

const fabrics: Fabric[] = [
  { id: "lorea-gri", name: "Lorea Gri Düz", bg: "linear-gradient(135deg,#c9c2bd,#b7afa9)", warning: true },
  { id: "marven-vizon", name: "Marven Vizon Serpme", bg: "linear-gradient(135deg,#f1cdb6,#e3b598)", warning: true },
  { id: "lorea-antrasit", name: "Lorea Antrasit Düz", bg: "linear-gradient(135deg,#4b4f54,#363a3f)", warning: true },
  { id: "sandra-haki", name: "Sandra Haki Düz", bg: "linear-gradient(135deg,#33523f,#243a2d)", warning: true },
  { id: "cross-krem", name: "Cross Krem Düz", bg: "linear-gradient(135deg,#dcd9b8,#c8c69b)", warning: true },
  { id: "lorea-vizon", name: "Lorea Vizon Düz", bg: "linear-gradient(135deg,#e3c2a0,#caa17a)", warning: true },
  { id: "marven-antrasit", name: "Marven Antrasit", bg: "linear-gradient(135deg,#3f4348,#2a2d31)" },
  { id: "linen-krem", name: "Linen Krem Duz", bg: "linear-gradient(135deg,#eee6cf,#d9cfb1)" },
];

const DETAIL_GRADIENT = "from-stone-200 via-stone-100 to-emerald-100";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_PART: Part = {
  slug: "uclu-koltuk",
  name: "",
  regions: 4,
  silhouette: "uclu",
};

function ProductDetailPage() {
  const router = useRouter();
  const params = useParams<{ collection: string; part: string }>();
  const searchParams = useSearchParams();
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");
  const collectionId = params.collection;
  const partParam = params.part;
  const fromCategory = searchParams.get("kategori");

  const mockPart = parts.find((x) => x.slug === partParam) ?? null;
  const isProductId = UUID_RE.test(partParam);

  const [collectionName, setCollectionName] = useState(tCommon("collectionFallback"));
  const [product, setProduct] = useState<CatalogProductDetail | null>(null);
  const [loading, setLoading] = useState(isProductId);
  const [error, setError] = useState<string | null>(null);
  const [selection, setSelection] = useState<Record<string, Fabric | null>>({});
  const [pickerRegion, setPickerRegion] = useState<string | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  /** Keep viewer mounted after first open so gallery switches don't reload the model. */
  const [viewerMounted, setViewerMounted] = useState(false);

  const part: Part | null = mockPart ?? (isProductId || product
    ? { ...DEFAULT_PART, name: tCommon("productFallback") }
    : null);

  const regionLabels = useMemo(
    () => Array.from({ length: part?.regions ?? 0 }, (_, i) => t("regionLabel", { n: i + 2 })),
    [part?.regions, t],
  );

  const sugarProductId = product?.productModalId?.trim() || null; // CRM productModalId ≡ Sugar sugarProductId
  const has3d = Boolean(sugarProductId);

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[];
    const urls = [
      ...(product.images ?? []).map((img) => img.url || img.thumbnailUrl),
      product.thumbnailUrl,
    ].filter((url): url is string => Boolean(url));
    return Array.from(new Set(urls));
  }, [product]);

  type GalleryItem =
    | { kind: "3d"; key: "3d" }
    | { kind: "image"; key: string; url: string };

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
    // Prefer photos first so "Evinizde Görün" CTA is visible; 3D is first thumb when present.
    setActiveGalleryIndex(has3d && galleryImages.length > 0 ? 1 : 0);
    setViewerMounted(false);
  }, [product?.id, has3d, galleryImages.length]);

  const selecting3d =
    has3d &&
    galleryItems[
      galleryItems.length
        ? Math.min(activeGalleryIndex, galleryItems.length - 1)
        : 0
    ]?.kind === "3d";

  useEffect(() => {
    if (selecting3d) setViewerMounted(true);
  }, [selecting3d]);

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
            setError(err instanceof Error ? err.message : tCatalog("productLoadError"));
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
      <div className="rounded-2xl bg-white border border-black/5 py-12 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/60">
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

  const allSelected = regionLabels.every((r) => selection[r]);
  const productTitle = product?.name
    ?? `${collectionName.replace(" Koltuk Takımı", "")} ${part.name}`;
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
    <div className="flex min-h-full flex-col lg:h-full lg:min-h-0 lg:overflow-hidden">
      <div className="mb-4 shrink-0">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)] hover:opacity-80"
        >
          <ArrowLeft className="size-4" /> {tCommon("back")}
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 lg:grid-cols-[1fr_400px] lg:overflow-hidden">
        <div className="flex min-h-[360px] flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-sm lg:h-full lg:min-h-0">
          <div
            className={`relative min-h-[280px] flex-1 bg-gradient-to-br ${DETAIL_GRADIENT} grid place-items-center`}
          >
            {sugarProductId && viewerMounted && (
              <ModelViewerHost
                key={sugarProductId}
                sugarProductId={sugarProductId}
                companyId={SUGAR_MODEL_VIEWER_COMPANY_ID}
                ar
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
                  selection={selection}
                  regions={regionLabels}
                />
              ))}

            {has3d && !is3dActive && (
              <button
                type="button"
                onClick={showInHome}
                className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[color:var(--istikbal-blue)] text-white font-semibold text-sm shadow-lg hover:bg-[color:var(--istikbal-navy)] transition-colors"
              >
                <Box className="size-4" /> {t("seeInYourHome")}
              </button>
            )}
            {galleryItems.length > 1 && (
              <button
                type="button"
                onClick={cycleGallery}
                className="absolute top-5 right-5 z-10 size-10 grid place-items-center rounded-full bg-white/80 hover:bg-white text-[color:var(--istikbal-blue)] shadow-sm"
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
                      ? "border-[color:var(--istikbal-yellow)] ring-2 ring-[color:var(--istikbal-yellow)]/30"
                      : "border-transparent hover:border-[color:var(--istikbal-blue)]/20"
                  }`}
                >
                  {item.kind === "3d" ? (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-[color:var(--istikbal-blue)]/5 text-[color:var(--istikbal-blue)]">
                      <Box className="size-5" />
                      <span className="text-[10px] font-bold tracking-wide">{t("gallery3d")}</span>
                    </span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col rounded-3xl border border-black/5 bg-white p-6 shadow-sm lg:h-full lg:overflow-y-auto">
          <div className="mb-4 shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/45">
              {[product?.categoryName, collectionName].filter(Boolean).join(" · ") || collectionName}
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[color:var(--istikbal-blue)] leading-tight">
              {productTitle}
            </h2>
            {product?.sku && (
              <p className="mt-1 text-xs text-[color:var(--istikbal-blue)]/50">{t("skuLabel", { sku: product.sku })}</p>
            )}
          </div>

          <div className="mb-5 shrink-0 rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4">
            <p className="text-xs font-bold text-[color:var(--istikbal-blue)] mb-2">{t("fabricRegionsTitle")}</p>
            <div className="flex items-center gap-1.5 mb-2">
              {regionLabels.map((r, i) => (
                <div key={r} className="flex-1 h-2 rounded-full overflow-hidden bg-white">
                  <div
                    className="h-full transition-all"
                    style={{
                      background: selection[r]?.bg || `hsl(${i * 60}, 70%, 60%)`,
                      width: selection[r] ? "100%" : "30%",
                    }}
                  />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[color:var(--istikbal-blue)]/55 leading-relaxed">
              {t("regionMatchHelp")}
            </p>
          </div>

          <div className="min-h-0 flex-1 space-y-2">
            {regionLabels.map((r) => {
              const f = selection[r];
              return (
                <button
                  key={r}
                  onClick={() => setPickerRegion(r)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[color:var(--istikbal-blue)]/5 hover:bg-[color:var(--istikbal-blue)]/10 transition-colors group"
                >
                  <span className="font-bold text-[color:var(--istikbal-blue)]">{r}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm ${
                        f ? "text-[color:var(--istikbal-blue)]/80" : "text-[color:var(--istikbal-blue)]/50"
                      }`}
                    >
                      {f?.name || t("chooseFabric")}
                    </span>
                    <span
                      className="size-7 rounded-md border border-black/10 shadow-inner"
                      style={{
                        background:
                          f?.bg ||
                          "repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 4px,#f3f4f6 4px,#f3f4f6 8px)",
                      }}
                    />
                    <ChevronRight className="size-4 text-[color:var(--istikbal-blue)]/40 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 shrink-0 space-y-2">
            <button
              disabled={!allSelected}
              className="w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:bg-[color:var(--istikbal-blue)]/15 disabled:text-[color:var(--istikbal-blue)]/40 disabled:cursor-not-allowed transition-all shadow-md"
            >
              <ShoppingCart className="size-4" /> {t("addToCart")}
            </button>
            {!allSelected && (
              <p className="text-center text-xs font-semibold text-[#f0a400] bg-[color:var(--istikbal-yellow)]/15 py-2 rounded-xl">
                {t("selectAllRegionsHint")}
              </p>
            )}
          </div>
        </aside>

        {pickerRegion && (
          <FabricPicker
            region={pickerRegion}
            current={selection[pickerRegion]?.id}
            onClose={() => setPickerRegion(null)}
            onPick={(f) => {
              setSelection((s) => ({ ...s, [pickerRegion]: f }));
              setPickerRegion(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function FabricPicker({
  region,
  current,
  onClose,
  onPick,
}: {
  region: string;
  current?: string;
  onClose: () => void;
  onPick: (f: Fabric) => void;
}) {
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 size-9 grid place-items-center rounded-full hover:bg-[color:var(--istikbal-blue)]/5 text-[color:var(--istikbal-blue)]/60"
        >
          <X className="size-5" />
        </button>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/45">
            {region}
          </p>
          <h3 className="text-2xl font-extrabold text-[color:var(--istikbal-blue)]">{t("suitableFabricsTitle")}</h3>
          <p className="text-sm text-[color:var(--istikbal-blue)]/55 mt-1">
            {t("suitableFabricsHint")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fabrics.map((f) => {
            const active = f.id === current;
            return (
              <button
                key={f.id}
                onClick={() => onPick(f)}
                className={`group text-left rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  active
                    ? "border-[color:var(--istikbal-blue)] shadow-lg"
                    : "border-transparent bg-[color:var(--istikbal-blue)]/5"
                }`}
              >
                <div className="relative h-36" style={{ background: f.bg }}>
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), transparent 60%), repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 2px, transparent 2px 5px)",
                    }}
                  />
                  {f.warning && (
                    <span className="absolute bottom-2 right-2 size-7 grid place-items-center rounded-full bg-[color:var(--istikbal-yellow)] text-[color:var(--istikbal-blue)] shadow-md">
                      <AlertCircle className="size-4" />
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[color:var(--istikbal-blue)] text-white text-[11px] font-bold">
                      <Check className="size-3" /> {tCommon("selected")}
                    </span>
                  )}
                </div>
                <p className="px-4 py-3 font-semibold text-[color:var(--istikbal-blue)]">{f.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProductHero({
  part,
  view,
  selection,
  regions,
}: {
  part: Part["silhouette"];
  view: number;
  selection: Record<string, Fabric | null>;
  regions: string[];
}) {
  const fillFor = (i: number) => selection[regions[i]]?.bg || "#ffffff";
  const rotate = view === 1 ? "rotate(-8deg)" : view === 2 ? "rotate(8deg) scale(0.95)" : "rotate(0)";

  if (part === "puf") {
    return (
      <svg viewBox="0 0 220 110" className="w-3/4 drop-shadow-2xl" style={{ transform: rotate }}>
        <rect x="10" y="25" width="200" height="60" rx="14" style={{ fill: fillFor(0) }} stroke="#0f3478" strokeOpacity=".1" />
        <rect x="10" y="60" width="200" height="25" rx="10" style={{ fill: fillFor(1) }} stroke="#0f3478" strokeOpacity=".1" />
      </svg>
    );
  }

  const w = part === "uclu" ? 360 : part === "ikili" ? 280 : 200;
  return (
    <svg
      viewBox={`0 0 ${w} 200`}
      className="w-[78%] drop-shadow-2xl"
      style={{ transform: rotate, transition: "transform 0.4s" }}
    >
      <ellipse cx={w / 2} cy="185" rx={w / 2.4} ry="8" fill="#000" opacity="0.1" />
      <rect x="20" y="100" width={w - 40} height="70" rx="16" style={{ fill: fillFor(0) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x="40" y="60" width={w - 80} height="50" rx="12" style={{ fill: fillFor(1) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x="6" y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x={w - 36} y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      {regions.length >= 4 && (
        <>
          <rect x="60" y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
          <rect x={w - 120} y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
        </>
      )}
      <rect x="14" y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
      <rect x={w - 20} y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
    </svg>
  );
}

export default ProductDetailPage;
