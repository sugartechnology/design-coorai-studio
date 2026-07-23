"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  Hand,
  Image as ImageIcon,
  Lightbulb,
  Loader2,
  Minus,
  Palette,
  Plus,
  QrCode,
  Search,
  Settings2,
  Smartphone,
  Sofa,
  Sparkles,
  Upload,
  Users,
  Wand2,
  X,
  Trash2,
  RotateCcw,
  Download,
  Coins,
  FileText,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { InfiniteScrollSentinel } from "@/components/InfiniteScrollSentinel";
import { QuoteOfferSheet } from "@/components/offers/QuoteOfferSheet";
import {
  useCatalogFilters,
  useInfiniteScroll,
  useProductSearch,
  getProductById,
  type CatalogProduct,
} from "@/lib/catalog";
import {
  lineFromCatalogProduct,
  type QuoteDraft,
} from "@/lib/offers";
import { defaultLocale, isAppLocale } from "@/i18n/config";
import {
  ASPECT_RATIO_OPTIONS,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_IMAGE_SIZE,
  DEFAULT_LIGHTING_MODE,
  generateRoomDesign,
  generateRoomReference,
  IMAGE_SIZE_OPTIONS,
  isGenerationSuccessful,
  LIGHTING_OPTIONS,
  PEOPLE_AGE_OPTIONS,
  PEOPLE_GENDER_OPTIONS,
  PERSONALIZE_OPTIONS,
  pollGenerationUntilDone,
  quoteAiCredits,
  resolveGenerationImageUrl,
  useAiGalleryHistory,
  useAiStudioSession,
  useCreditBalance,
  type AiGalleryItem,
  type AspectRatioKey,
  type ImageSizeKey,
  type LightingModeKey,
  type PeopleAgeKey,
  type PeopleGenderKey,
  type PersonalizeOptionKey,
  type ScenePerson,
} from "@/lib/ai-studio";
import { renderScenePreviewBlob } from "@/lib/ai-studio/scene-preview";
import { uploadPortalFile } from "@/lib/files/upload";
import { PortalCrmError } from "@/lib/portal-crm";

type PlacedItem = {
  uid: string;
  product: CatalogProduct;
  x: number;
  y: number;
  scale: number;
};

type SelectedProduct = {
  uid: string;
  product: CatalogProduct;
};

const PRODUCT_MIME = "application/x-product";

const FALLBACK_THUMB = "from-stone-200 to-stone-100";

const chipBase =
  "h-9 rounded-full border text-xs font-bold transition inline-flex items-center justify-center gap-1.5 px-3";
const chipActive =
  "bg-[color:var(--istikbal-blue)] text-white border-[color:var(--istikbal-blue)]";
const chipIdle =
  "bg-white text-[color:var(--istikbal-blue)] border-black/10 hover:border-[color:var(--istikbal-blue)]/30";

function formatGalleryTimestamp(item: AiGalleryItem, fallback: string) {
  if (!item.createdAt) return fallback;
  try {
    return new Date(item.createdAt).toLocaleString();
  } catch {
    return fallback;
  }
}

function AiStudioPage() {
  const t = useTranslations("aiStudio");
  const tOffers = useTranslations("offers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const language = isAppLocale(locale) ? locale : defaultLocale;
  const router = useRouter();
  const { sessionId, ready: sessionReady } = useAiStudioSession();
  const {
    availableCredit,
    depleted: creditsDepleted,
    lowCredit,
    loading: creditsLoading,
    refresh: refreshCredits,
  } = useCreditBalance(sessionReady);
  const {
    items: galleryItems,
    loading: galleryLoading,
    loadingMore: galleryLoadingMore,
    hasMore: galleryHasMore,
    loadMore: galleryLoadMore,
    refresh: refreshGallery,
    mergeItems: mergeGalleryItems,
    kickPoll: kickGalleryPoll,
    error: galleryError,
  } = useAiGalleryHistory({
    contextTypes: ["AI_STUDIO_ROOM"],
    enabled: sessionReady,
    pageSize: 12,
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [pendingHistoryItem, setPendingHistoryItem] = useState<AiGalleryItem | null>(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [galleryScrollEl, setGalleryScrollEl] = useState<HTMLDivElement | null>(null);
  const { sentinelRef: gallerySentinelRef } = useInfiniteScroll({
    hasMore: galleryHasMore,
    loading: galleryLoading || galleryLoadingMore,
    onLoadMore: galleryLoadMore,
    root: galleryScrollEl,
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktopViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const historyPanelItems = useMemo(() => {
    if (!pendingHistoryItem) return galleryItems;
    const exists = galleryItems.some(
      (item) =>
        item.id === pendingHistoryItem.id ||
        Boolean(pendingHistoryItem.jobId && item.jobId === pendingHistoryItem.jobId),
    );
    if (exists) return galleryItems;
    return [pendingHistoryItem, ...galleryItems];
  }, [galleryItems, pendingHistoryItem]);

  useEffect(() => {
    if (!pendingHistoryItem) return;
    const matched = galleryItems.some(
      (item) =>
        item.id === pendingHistoryItem.id ||
        Boolean(pendingHistoryItem.jobId && item.jobId === pendingHistoryItem.jobId),
    );
    if (matched) {
      setPendingHistoryItem(null);
      return;
    }
    const pendingCreatedAt = pendingHistoryItem.createdAt
      ? new Date(pendingHistoryItem.createdAt).getTime()
      : 0;
    if (!pendingCreatedAt) return;
    const hasNewerCompleted = galleryItems.some((item) => {
      if (!item?.createdAt) return false;
      if ((item.status ?? "").toUpperCase() !== "COMPLETED") return false;
      if (!item.imageUrl && !item.thumbnailUrl) return false;
      return new Date(item.createdAt).getTime() >= pendingCreatedAt;
    });
    if (hasNewerCompleted) setPendingHistoryItem(null);
  }, [galleryItems, pendingHistoryItem]);

  const showRenderGallery = isDesktopViewport
    ? isGalleryOpen
    : historyPanelItems.length > 0 || Boolean(pendingHistoryItem) || galleryLoadingMore;

  const latestGalleryThumbnail = useMemo(() => {
    const latest = historyPanelItems.find((item) => {
      const status = (item.status ?? "").toUpperCase();
      return status === "COMPLETED" && Boolean(item.imageUrl || item.thumbnailUrl);
    });
    return latest ? resolveGenerationImageUrl(latest) || latest.thumbnailUrl || null : null;
  }, [historyPanelItems]);
  const {
    categories,
    collections,
    loading: filtersLoading,
  } = useCatalogFilters();

  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [openSections, setOpenSections] = useState({
    design: true,
    products: true,
    lighting: false,
    people: false,
    personalize: false,
    resolution: false,
  });
  const [productTab, setProductTab] = useState<"all" | "collections" | "categories">("categories");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCategoryId, setPickerCategoryId] = useState<string | null>(null);
  const [pickerCollectionId, setPickerCollectionId] = useState<string | null>(null);
  const [roomPreviewUrl, setRoomPreviewUrl] = useState<string | null>(null);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<SelectedProduct[]>([]);
  const [placed, setPlaced] = useState<PlacedItem[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrSession] = useState(() => Math.random().toString(36).slice(2, 8).toUpperCase());
  const [promptNotes, setPromptNotes] = useState("");
  const [creditCost, setCreditCost] = useState<number | null>(null);
  const [busy, setBusy] = useState<"idle" | "upload" | "reference" | "render">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [lightingMode, setLightingMode] = useState<LightingModeKey>(DEFAULT_LIGHTING_MODE);
  const [peopleGender, setPeopleGender] = useState<PeopleGenderKey | null>("female");
  const [peopleAgeGroup, setPeopleAgeGroup] = useState<PeopleAgeKey | null>("young-adult");
  const [scenePeople, setScenePeople] = useState<ScenePerson[]>([]);
  const [personalizeOptions, setPersonalizeOptions] = useState<PersonalizeOptionKey[]>([]);
  const [imageSize, setImageSize] = useState<ImageSizeKey>(DEFAULT_IMAGE_SIZE);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioKey>(DEFAULT_ASPECT_RATIO);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState<QuoteDraft | null>(null);
  const [quoteBusy, setQuoteBusy] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const roomInputRef = useRef<HTMLInputElement>(null);
  const qrUploadInputRef = useRef<HTMLInputElement>(null);

  const mobileUploadUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/ai/upload?s=${qrSession}`
      : `/ai/upload?s=${qrSession}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    mobileUploadUrl,
  )}`;

  const categoryChips = useMemo(() => categories.slice(0, 8), [categories]);
  const collectionChips = useMemo(() => collections.slice(0, 8), [collections]);

  const openPicker = useCallback(
    (opts?: { categoryId?: string | null; collectionId?: string | null }) => {
      setPickerCategoryId(opts?.categoryId ?? null);
      setPickerCollectionId(opts?.collectionId ?? null);
      setPickerOpen(true);
    },
    [],
  );

  const addProductToSidebar = useCallback((product: CatalogProduct) => {
    setSelected((prev) => [
      ...prev,
      { uid: `${product.id}-${Date.now()}`, product },
    ]);
    setOpenSections((s) => ({ ...s, products: true }));
    setMobileOpen(false);
  }, []);

  const removeSelected = useCallback((uid: string) => {
    setSelected((prev) => prev.filter((p) => p.uid !== uid));
    setPlaced((prev) => prev.filter((p) => p.uid !== uid));
    setSelectedUid((cur) => (cur === uid ? null : cur));
  }, []);

  const openQuoteFromSelected = useCallback(async () => {
    if (selected.length === 0) return;
    setQuoteBusy(true);
    setError(null);
    try {
      const qtyById = new Map<string, { product: CatalogProduct; quantity: number }>();
      for (const item of selected) {
        const existing = qtyById.get(item.product.id);
        if (existing) existing.quantity += 1;
        else qtyById.set(item.product.id, { product: item.product, quantity: 1 });
      }

      const lines = await Promise.all(
        [...qtyById.values()].map(async ({ product, quantity }) => {
          try {
            const detail = await getProductById(product.id, router);
            return lineFromCatalogProduct(detail, {
              quantity,
              currency: "TRY",
              variantSelections: [],
            });
          } catch {
            return lineFromCatalogProduct(
              {
                id: product.id,
                name: product.name,
                sku: null,
                thumbnailUrl: product.thumbnailUrl,
                prices: [],
              },
              { quantity, currency: "TRY", variantSelections: [] },
            );
          }
        }),
      );

      const renderUrl = roomPreviewUrl || latestGalleryThumbnail;
      setQuoteDraft({
        title: tOffers("createQuote"),
        currency: "TRY",
        language,
        notes: promptNotes || undefined,
        section: {
          name: "AI Studio",
          roomType: "living-room",
          promptNotes: promptNotes || null,
          images: renderUrl
            ? [{ imageUrl: renderUrl, imageOrder: 0, altText: "AI render" }]
            : [],
        },
        lines,
      });
      setQuoteOpen(true);
    } finally {
      setQuoteBusy(false);
    }
  }, [
    selected,
    router,
    roomPreviewUrl,
    latestGalleryThumbnail,
    promptNotes,
    language,
    tOffers,
  ]);

  const placeProductOnCanvas = useCallback(
    (product: CatalogProduct, x: number, y: number, uid?: string) => {
      const itemUid = uid ?? `${product.id}-${Date.now()}`;
      setSelected((prev) =>
        prev.some((p) => p.uid === itemUid)
          ? prev
          : [...prev, { uid: itemUid, product }],
      );
      setPlaced((prev) => {
        const existing = prev.find((p) => p.uid === itemUid);
        if (existing) {
          return prev.map((p) => (p.uid === itemUid ? { ...p, x, y } : p));
        }
        return [...prev, { uid: itemUid, product, x, y, scale: 1 }];
      });
    },
    [],
  );

  useEffect(() => {
    if (!sessionReady) return;
    let cancelled = false;
    void (async () => {
      try {
        const quote = await quoteAiCredits("AI_STUDIO_ROOM", {
          imageSize,
          aspectRatio,
          router,
        });
        if (!cancelled) setCreditCost(quote.creditAmount ?? null);
      } catch {
        if (!cancelled) setCreditCost(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionReady, router, imageSize, aspectRatio]);

  const addPersonToScene = () => {
    if (!peopleGender || !peopleAgeGroup) return;
    setScenePeople((prev) => {
      const idx = prev.findIndex(
        (p) => p.gender === peopleGender && p.ageGroup === peopleAgeGroup,
      );
      if (idx >= 0) {
        return prev.map((p, i) => (i === idx ? { ...p, quantity: p.quantity + 1 } : p));
      }
      return [...prev, { gender: peopleGender, ageGroup: peopleAgeGroup, quantity: 1 }];
    });
  };

  const updatePersonQuantity = (index: number, delta: number) => {
    setScenePeople((prev) =>
      prev
        .map((p, i) => (i === index ? { ...p, quantity: p.quantity + delta } : p))
        .filter((p) => p.quantity > 0),
    );
  };

  const removePerson = (index: number) => {
    setScenePeople((prev) => prev.filter((_, i) => i !== index));
  };

  const togglePersonalize = (key: PersonalizeOptionKey) => {
    setPersonalizeOptions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };
  const handleCanvasDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (mode !== "manual") return;
      const productJson = e.dataTransfer.getData(PRODUCT_MIME);
      if (!productJson || !canvasRef.current) return;
      let product: CatalogProduct;
      let uid: string | undefined;
      try {
        const raw = JSON.parse(productJson) as
          | CatalogProduct
          | { product: CatalogProduct; uid?: string };
        if ("product" in raw && raw.product && typeof raw.product === "object") {
          product = raw.product;
          uid = raw.uid;
        } else {
          product = raw as CatalogProduct;
        }
      } catch {
        return;
      }
      if (!product?.id) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      placeProductOnCanvas(product, x, y, uid);
    },
    [mode, placeProductOnCanvas],
  );

  const movePlaced = (uid: string, e: React.DragEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPlaced((prev) => prev.map((p) => (p.uid === uid ? { ...p, x, y } : p)));
  };

  const onRoomUpload = async (file?: File) => {
    if (!file) return;
    setError(null);
    setBusy("upload");
    try {
      const localUrl = URL.createObjectURL(file);
      setRoomPreviewUrl(localUrl);
      const uploaded = await uploadPortalFile(file, router);
      setReferenceImageUrl(uploaded);
      setStatusMessage(t("statusRoomUploaded"));
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("errorRoomUpload"));
      setRoomPreviewUrl(null);
      setReferenceImageUrl(null);
    } finally {
      setBusy("idle");
    }
  };

  const handleGenerateReference = async () => {
    if (!sessionId) return;
    setError(null);
    setBusy("reference");
    setStatusMessage(t("statusGeneratingReference"));
    try {
      const generation = await generateRoomReference(
        sessionId,
        {
          roomType: "living-room",
          styleId: "modern",
          roomSize: "medium",
          promptNotes: promptNotes || undefined,
        },
        router,
      );
      const done = isGenerationSuccessful(generation.status)
        ? generation
        : await pollGenerationUntilDone({
            sessionId,
            generationId: generation.id,
            kind: "reference",
            router,
          });
      if (!isGenerationSuccessful(done.status)) {
        throw new Error(t("errorReferenceFailed"));
      }
      const url = resolveGenerationImageUrl(done);
      if (!url) throw new Error(t("errorGeneratedImageMissing"));
      setRoomPreviewUrl(url);
      setReferenceImageUrl(url);
      setStatusMessage(t("statusReferenceReady"));
      void refreshCredits();
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      void refreshCredits();
      setError(err instanceof Error ? err.message : t("errorRoomGenerate"));
    } finally {
      setBusy("idle");
    }
  };

  const handleRender = async () => {
    if (!sessionId) return;
    if (!referenceImageUrl) {
      setError(t("errorNeedRoomFirst"));
      return;
    }
    setError(null);
    setBusy("render");
    setStatusMessage(t("statusRendering"));
    setIsGalleryOpen(true);

    const optimisticItem: AiGalleryItem = {
      id: `pending-${sessionId}-${Date.now()}`,
      prompt: promptNotes || undefined,
      status: "PROCESSING",
      createdAt: new Date().toISOString(),
      contextType: "AI_STUDIO_ROOM",
    };
    kickGalleryPoll();
    setPendingHistoryItem(optimisticItem);

    try {
      const products = selected.map((p) => ({
        productId: p.product.id,
        name: p.product.name,
        quantity: 1,
        imageUrl: p.product.thumbnailUrl || undefined,
      }));

      let sceneLayout: string | undefined;
      let scenePreviewImageUrl: string | undefined;

      if (mode === "manual" && placed.length > 0 && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const layout = {
          version: 1,
          stageWidth: Math.round(rect.width),
          stageHeight: Math.round(rect.height),
          backgroundImageUrl: referenceImageUrl,
          objects: placed.map((p, index) => ({
            id: p.uid,
            src: p.product.thumbnailUrl || "",
            x: (p.x / 100) * rect.width,
            y: (p.y / 100) * rect.height,
            width: 96,
            height: 96,
            scaleX: p.scale,
            scaleY: p.scale,
            rotation: 0,
            zIndex: index,
          })),
        };
        sceneLayout = JSON.stringify(layout);

        const previewBlob = await renderScenePreviewBlob({
          stageWidth: rect.width,
          stageHeight: rect.height,
          backgroundImageUrl: referenceImageUrl,
          objects: placed.map((p) => ({
            src: p.product.thumbnailUrl,
            xPct: p.x,
            yPct: p.y,
            scale: p.scale,
            name: p.product.name,
          })),
        });
        if (!previewBlob) throw new Error(t("errorScenePreview"));
        const previewFile = new File([previewBlob], `scene-preview-${Date.now()}.png`, {
          type: "image/png",
        });
        scenePreviewImageUrl = await uploadPortalFile(previewFile, router);
      }

      const generation = await generateRoomDesign(
        sessionId,
        {
          designMode: mode,
          promptNotes: promptNotes || undefined,
          referenceImageUrl,
          sceneLayout,
          scenePreviewImageUrl,
          products: products.length ? products : undefined,
          styleId: "modern",
          roomType: "living-room",
          lightingMode,
          lightingDetailed: true,
          people: scenePeople.length ? scenePeople : undefined,
          peopleActive: scenePeople.length > 0,
          personalizeOptions: personalizeOptions.length ? personalizeOptions : undefined,
          imageSize,
          aspectRatio,
        },
        router,
      );

      const normalized: AiGalleryItem = {
        ...optimisticItem,
        ...generation,
        prompt: generation.prompt || optimisticItem.prompt,
        status: generation.status || optimisticItem.status,
        createdAt: generation.createdAt || optimisticItem.createdAt,
      };
      setPendingHistoryItem(
        (normalized.status ?? "").toUpperCase() === "COMPLETED" &&
          Boolean(normalized.imageUrl || normalized.thumbnailUrl)
          ? null
          : normalized,
      );
      mergeGalleryItems([normalized]);
      void refreshCredits();
      void refreshGallery();

      const done = isGenerationSuccessful(generation.status)
        ? generation
        : await pollGenerationUntilDone({
            sessionId,
            generationId: generation.id,
            kind: "room",
            router,
          });

      if (!isGenerationSuccessful(done.status)) {
        throw new Error(t("errorRenderFailed"));
      }
      const url = resolveGenerationImageUrl(done);
      if (!url) throw new Error(t("errorRenderImageMissing"));
      setRoomPreviewUrl(url);
      setPlaced([]);
      setSelected([]);
      setSelectedUid(null);
      setStatusMessage(t("statusRenderDone"));
      setPendingHistoryItem(null);
      mergeGalleryItems([{ ...normalized, ...done, status: done.status }]);
      void refreshCredits();
      void refreshGallery();
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setPendingHistoryItem(null);
      void refreshCredits();
      setError(err instanceof Error ? err.message : t("errorRenderStart"));
    } finally {
      setBusy("idle");
    }
  };

  const toggle = (k: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [k]: !s[k] }));

  const estimatedCost = creditCost ?? Math.max(2, selected.length + 2);
  const isBusy = busy !== "idle";
  const balanceDisplay =
    creditsLoading && availableCredit == null
      ? "—"
      : availableCredit != null
        ? String(availableCredit)
        : "—";
  const renderDisabled = isBusy || !sessionReady || creditsDepleted;

  const applyGalleryItem = (item: AiGalleryItem) => {
    const url = resolveGenerationImageUrl(item);
    if (!url) return;
    const status = (item.status ?? "").toUpperCase();
    if (status && status !== "COMPLETED") return;
    setRoomPreviewUrl(url);
  };

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)] flex flex-col">
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> {tCommon("back")}
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">{t("headerTitle")}</div>
        <div className="flex-1" />
        <Link href="/" className="text-[color:var(--istikbal-blue)]/40 hover:text-[color:var(--istikbal-blue)]">
          <X className="size-5" />
        </Link>
      </header>

      <div className="flex flex-1 min-h-0">
      {(() => {
        const sectionsContent = (
          <div className="p-4 lg:p-5 space-y-4">
            <Section title={t("sectionDesignMode")} open={openSections.design} onToggle={() => toggle("design")}>
              <div className="grid grid-cols-2 gap-3">
                <ModeCard
                  active={mode === "auto"}
                  onClick={() => {
                    setMode("auto");
                    setPlaced([]);
                    setSelectedUid(null);
                  }}
                  icon={<Wand2 className="size-5" />}
                  title={t("modeAuto")}
                  subtitle={t("modeAutoSubtitle")}
                />
                <ModeCard
                  active={mode === "manual"}
                  onClick={() => setMode("manual")}
                  icon={<Hand className="size-5" />}
                  title={t("modeManual")}
                  subtitle={t("modeManualSubtitle")}
                />
              </div>
            </Section>

            <Section
              title={t("sectionProducts")}
              icon={<Sofa className="size-4" />}
              badge={selected.length || undefined}
              open={openSections.products}
              onToggle={() => toggle("products")}
            >
              <div className="grid grid-cols-3 gap-1 mb-3 bg-[color:var(--istikbal-blue-soft)] rounded-full p-1">
                {([
                  ["all", "tabAll"],
                  ["categories", "tabCategory"],
                  ["collections", "tabCollection"],
                ] as const).map(([k, labelKey]) => (
                  <button
                    key={k}
                    onClick={() => setProductTab(k)}
                    className={`h-8 min-w-0 rounded-full text-[10.5px] font-bold tracking-tight leading-none px-1 truncate transition ${
                      productTab === k
                        ? "bg-[color:var(--istikbal-blue)] text-white"
                        : "text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"
                    }`}
                  >
                    {t(labelKey).toUpperCase()}
                  </button>
                ))}
              </div>

              <button
                onClick={() => openPicker()}
                className="w-full h-10 rounded-full border border-dashed border-black/15 text-sm font-semibold text-[color:var(--istikbal-blue)]/70 hover:border-[color:var(--istikbal-blue)]/40 hover:text-[color:var(--istikbal-blue)] flex items-center justify-center gap-2 transition"
              >
                <Upload className="size-4" /> {t("selectProduct")}
              </button>

              {selected.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-[10px] font-extrabold tracking-[0.14em] text-[color:var(--istikbal-blue)]/45">
                    {mode === "manual" ? t("selectedProductsManualHint") : t("selectedProducts")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.map((item) => (
                      <div
                        key={item.uid}
                        draggable={mode === "manual"}
                        onDragStart={(e) => {
                          if (mode !== "manual") {
                            e.preventDefault();
                            return;
                          }
                          e.dataTransfer.setData(
                            PRODUCT_MIME,
                            JSON.stringify({ product: item.product, uid: item.uid }),
                          );
                          e.dataTransfer.effectAllowed = "copyMove";
                        }}
                        className={`relative rounded-xl border border-black/5 bg-[color:var(--istikbal-blue-soft)]/40 p-2 ${
                          mode === "manual" ? "cursor-grab active:cursor-grabbing" : ""
                        }`}
                        title={
                          mode === "manual"
                            ? t("dragToSceneTitle")
                            : item.product.name
                        }
                      >
                        <button
                          type="button"
                          onClick={() => removeSelected(item.uid)}
                          className="absolute top-1 right-1 z-10 size-6 rounded-full bg-white/90 border border-black/10 text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)] inline-flex items-center justify-center"
                          title={tCommon("remove")}
                        >
                          <X className="size-3" />
                        </button>
                        <div className={`aspect-square rounded-lg bg-gradient-to-br ${FALLBACK_THUMB} overflow-hidden relative`}>
                          {item.product.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.product.thumbnailUrl}
                              alt={item.product.name}
                              className="absolute inset-0 h-full w-full object-cover"
                              draggable={false}
                            />
                          ) : null}
                        </div>
                        <p className="mt-1.5 text-[10px] font-bold text-[color:var(--istikbal-blue)] line-clamp-2 text-center">
                          {item.product.name}
                        </p>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={quoteBusy}
                    onClick={() => void openQuoteFromSelected()}
                    className="mt-3 w-full h-10 rounded-full bg-[color:var(--istikbal-blue)] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:opacity-50"
                  >
                    {quoteBusy ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    {tOffers("createQuote")}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                {filtersLoading && (
                  <div className="col-span-2 text-xs text-[color:var(--istikbal-blue)]/50 py-2">
                    {productTab === "collections" ? t("collectionsLoading") : t("categoriesLoading")}
                  </div>
                )}
                {productTab === "collections"
                  ? collectionChips.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openPicker({ collectionId: c.id })}
                        className="h-10 px-3 rounded-lg border border-black/5 bg-white hover:border-[color:var(--istikbal-blue)]/30 flex items-center gap-2 text-xs font-bold text-[color:var(--istikbal-blue)] transition truncate"
                      >
                        <span className="text-[color:var(--istikbal-blue)]/50">▦</span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    ))
                  : productTab === "categories"
                    ? categoryChips.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => openPicker({ categoryId: c.id })}
                          className="h-10 px-3 rounded-lg border border-black/5 bg-white hover:border-[color:var(--istikbal-blue)]/30 flex items-center gap-2 text-xs font-bold text-[color:var(--istikbal-blue)] transition truncate"
                        >
                          <span className="text-[color:var(--istikbal-blue)]/50">▦</span>
                          <span className="truncate">{c.name}</span>
                        </button>
                      ))
                    : null}
              </div>

              <button
                type="button"
                onClick={() => openPicker()}
                className="w-full mt-3 h-9 rounded-full bg-[color:var(--istikbal-blue-soft)] hover:bg-[color:var(--istikbal-blue)]/10 text-xs font-bold text-[color:var(--istikbal-blue)] transition"
              >
                {t("loadMore")}
              </button>
            </Section>

            <Section title={t("sectionLighting")} icon={<Lightbulb className="size-4" />} open={openSections.lighting} onToggle={() => toggle("lighting")}>
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-1.5">
                  {LIGHTING_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      title={t(opt.labelKey)}
                      onClick={() => setLightingMode(opt.key)}
                      className={`h-12 rounded-xl border text-[10px] font-bold leading-tight px-1 transition ${
                        lightingMode === opt.key ? chipActive : chipIdle
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={LIGHTING_OPTIONS.length - 1}
                  step={1}
                  value={Math.max(
                    LIGHTING_OPTIONS.findIndex((o) => o.key === lightingMode),
                    0,
                  )}
                  onChange={(e) => {
                    const next = LIGHTING_OPTIONS[Number(e.target.value)]?.key;
                    if (next) setLightingMode(next);
                  }}
                  className="w-full accent-[color:var(--istikbal-blue)]"
                />
              </div>
            </Section>

            <Section title={t("sectionPeople")} icon={<Users className="size-4" />} open={openSections.people} onToggle={() => toggle("people")}>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50 mb-1.5">{t("genderLabel")}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PEOPLE_GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPeopleGender(opt.key)}
                        className={`${chipBase} w-full ${peopleGender === opt.key ? chipActive : chipIdle}`}
                      >
                        <span>{opt.symbol}</span> {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50 mb-1.5">{t("ageLabel")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PEOPLE_AGE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setPeopleAgeGroup(opt.key)}
                        className={`${chipBase} w-full ${peopleAgeGroup === opt.key ? chipActive : chipIdle}`}
                      >
                        {t(opt.labelKey)}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addPersonToScene}
                  disabled={!peopleGender || !peopleAgeGroup}
                  className="w-full h-10 rounded-full bg-[color:var(--istikbal-blue-soft)] hover:bg-[color:var(--istikbal-blue)]/10 text-xs font-bold text-[color:var(--istikbal-blue)] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="size-3.5" /> {t("addToScene")}
                </button>
                {scenePeople.length > 0 && (
                  <ul className="space-y-2">
                    {scenePeople.map((person, index) => {
                      const genderOpt = PEOPLE_GENDER_OPTIONS.find((g) => g.key === person.gender);
                      const ageOpt = PEOPLE_AGE_OPTIONS.find((a) => a.key === person.ageGroup);
                      return (
                      <li
                        key={`${person.gender}-${person.ageGroup}`}
                        className="flex items-center gap-2 rounded-xl border border-black/5 bg-white px-2.5 py-2"
                      >
                        <span className="flex-1 text-xs font-semibold text-[color:var(--istikbal-blue)] truncate">
                          {t("peopleComboLabel", {
                            age: ageOpt ? t(ageOpt.labelKey) : person.ageGroup,
                            gender: genderOpt ? t(genderOpt.labelKey) : person.gender,
                          })}
                        </span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updatePersonQuantity(index, -1)}
                            className="size-7 rounded-full border border-black/10 hover:bg-[color:var(--istikbal-blue-soft)] inline-flex items-center justify-center"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-[color:var(--istikbal-blue)]">
                            {person.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updatePersonQuantity(index, 1)}
                            className="size-7 rounded-full border border-black/10 hover:bg-[color:var(--istikbal-blue-soft)] inline-flex items-center justify-center"
                          >
                            <Plus className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePerson(index)}
                            className="size-7 rounded-full border border-black/10 hover:bg-rose-50 text-rose-600 inline-flex items-center justify-center"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </Section>

            <Section title={t("sectionPersonalize")} icon={<Palette className="size-4" />} open={openSections.personalize} onToggle={() => toggle("personalize")}>
              <div className="grid grid-cols-1 gap-2">
                {PERSONALIZE_OPTIONS.map((opt) => {
                  const active = personalizeOptions.includes(opt.key);
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => togglePersonalize(opt.key)}
                      className={`${chipBase} w-full justify-start ${active ? chipActive : chipIdle}`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title={t("sectionResolution")} icon={<Settings2 className="size-4" />} open={openSections.resolution} onToggle={() => toggle("resolution")}>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50 mb-1.5">{t("resolutionLabel")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {IMAGE_SIZE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setImageSize(opt.key)}
                        className={`rounded-xl border px-2 py-3 text-center transition ${
                          imageSize === opt.key ? chipActive : chipIdle
                        }`}
                      >
                        <div className="text-sm font-extrabold">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${imageSize === opt.key ? "text-white/80" : "text-[color:var(--istikbal-blue)]/50"}`}>
                          {opt.multiplier}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50 mb-1.5">{t("aspectRatioLabel")}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {ASPECT_RATIO_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setAspectRatio(opt.key)}
                        className={`${chipBase} w-full ${aspectRatio === opt.key ? chipActive : chipIdle}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>
          </div>
        );

        const RAIL_ITEMS: { key: keyof typeof openSections; icon: typeof Wand2; label: string }[] = [
          { key: "design", icon: Wand2, label: t("railMod") },
          { key: "products", icon: Sofa, label: t("railProducts") },
          { key: "lighting", icon: Lightbulb, label: t("railLight") },
          { key: "people", icon: Users, label: t("railPeople") },
          { key: "personalize", icon: Palette, label: t("railStyle") },
          { key: "resolution", icon: Settings2, label: t("railSize") },
        ];

        return (
          <>
            <aside className="hidden lg:block w-[360px] shrink-0 border-r border-black/5 bg-white overflow-y-auto">
              {sectionsContent}
            </aside>

            <aside className="lg:hidden w-14 shrink-0 border-r border-black/5 bg-white flex flex-col items-center py-3 gap-1">
              {RAIL_ITEMS.map(({ key, icon: Icon, label }) => (
                <button
                  key={key}
                  onClick={() => { setOpenSections((s) => ({ ...s, [key]: true })); setMobileOpen(true); }}
                  className="size-11 rounded-xl flex flex-col items-center justify-center gap-0.5 text-[color:var(--istikbal-blue)]/70 hover:bg-[color:var(--istikbal-blue-soft)] hover:text-[color:var(--istikbal-blue)] transition"
                  title={label}
                >
                  <Icon className="size-4" />
                  <span className="text-[8px] font-bold tracking-wider">{label.toUpperCase()}</span>
                </button>
              ))}
            </aside>

            {mobileOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
                <aside
                  className="absolute left-14 top-0 bottom-0 w-[320px] max-w-[80vw] bg-white overflow-y-auto shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 z-10 px-4 h-12 bg-white border-b border-black/5 flex items-center justify-between">
                    <span className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">{t("mobileSettings")}</span>
                    <button onClick={() => setMobileOpen(false)} className="text-[color:var(--istikbal-blue)]/50 hover:text-[color:var(--istikbal-blue)]">
                      <X className="size-4" />
                    </button>
                  </div>
                  {sectionsContent}
                </aside>
              </div>
            )}

            <div className="flex-1 flex flex-col lg:flex-row min-w-0 min-h-0">
            <main className="flex-1 flex flex-col min-w-0">
              <div className="px-3 sm:px-5 lg:px-8 pt-3 lg:pt-8 pb-2 lg:pb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-lg sm:text-xl lg:text-3xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight truncate">{t("pageTitle")}</h1>
                  <p className="hidden md:block mt-1.5 text-sm text-[color:var(--istikbal-blue)]/60">
                    {t("pageSubtitle")}
                  </p>
                </div>
                {/*<button
                  type="button"
                  onClick={() => setIsGalleryOpen((prev) => !prev)}
                  className="hidden lg:inline-flex shrink-0 h-10 px-4 rounded-full border border-black/10 bg-white text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue-soft)]"
                >
                  {isGalleryOpen ? t("galleryHide") : t("galleryShow")}
                </button>*/}
              </div>

              {(error || statusMessage) && (
                <div className="px-3 sm:px-5 lg:px-8 pb-2">
                  {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                  )}
                  {!error && statusMessage && (
                    <div className="rounded-xl border border-[color:var(--istikbal-blue)]/15 bg-white px-3 py-2 text-sm text-[color:var(--istikbal-blue)]/70">
                      {statusMessage}
                    </div>
                  )}
                </div>
              )}

              <div className="flex-1 px-3 sm:px-5 lg:px-8 pb-3 lg:pb-6 min-h-0">
                <div
                  ref={canvasRef}
                  onDragOver={(e) => {
                    if (mode !== "manual") return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={handleCanvasDrop}
                  onClick={(e) => { if (e.target === e.currentTarget) setSelectedUid(null); }}
                  className="relative w-full h-full min-h-[360px] lg:min-h-[520px] rounded-2xl bg-white border border-black/5 shadow-sm overflow-hidden"
                  style={roomPreviewUrl ? { backgroundImage: `url(${roomPreviewUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
                >
                  {!roomPreviewUrl && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                      <div className="w-16 h-16 lg:w-24 lg:h-24 rounded-2xl bg-[color:var(--istikbal-blue-soft)] flex items-center justify-center mb-4 lg:mb-6">
                        <ImageIcon className="size-7 lg:size-10 text-[color:var(--istikbal-blue)]/30" strokeWidth={1.5} />
                      </div>
                      <h2 className="text-sm lg:text-lg font-extrabold tracking-[0.14em] text-[color:var(--istikbal-blue)]">
                        {t("emptyCanvasTitle")}
                      </h2>
                      <p className="hidden sm:block mt-3 max-w-xl text-sm text-[color:var(--istikbal-blue)]/60">
                        {t("emptyCanvasHint")}
                      </p>
                      <div className="mt-4 lg:mt-6 flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <button
                          disabled={isBusy}
                          onClick={() => roomInputRef.current?.click()}
                          className="h-10 lg:h-11 px-4 lg:px-5 rounded-full bg-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/90 text-white text-xs lg:text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
                        >
                          {busy === "upload" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                          {t("uploadRoom")}
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => setQrOpen(true)}
                          className="h-10 lg:h-11 px-4 lg:px-5 rounded-full bg-white border border-black/10 text-[color:var(--istikbal-blue)] text-xs lg:text-sm font-bold inline-flex items-center gap-2 hover:bg-[color:var(--istikbal-blue-soft)] disabled:opacity-60"
                        >
                          <QrCode className="size-4" /> {t("uploadViaQr")}
                        </button>
                        <button
                          disabled={isBusy || !sessionReady || creditsDepleted}
                          onClick={() => void handleGenerateReference()}
                          className="h-10 lg:h-11 px-4 lg:px-5 rounded-full bg-white border border-black/10 text-[color:var(--istikbal-blue)] text-xs lg:text-sm font-bold inline-flex items-center gap-2 hover:bg-[color:var(--istikbal-blue-soft)] disabled:opacity-60"
                        >
                          {busy === "reference" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                          {t("generateRoom")}
                        </button>
                      </div>
                      <input ref={roomInputRef} type="file" accept="image/*" hidden onChange={(e) => void onRoomUpload(e.target.files?.[0])} />
                    </div>
                  )}

                  {mode === "manual" && placed.map((it) => (
                    <div
                      key={it.uid}
                      draggable
                      onDragStart={() => setDraggingId(it.uid)}
                      onDragEnd={(e) => { movePlaced(it.uid, e); setDraggingId(null); }}
                      onClick={(e) => { e.stopPropagation(); setSelectedUid(it.uid); }}
                      className={`group absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                        selectedUid === it.uid ? "ring-2 ring-[color:var(--istikbal-blue)] ring-offset-2" : ""
                      } ${draggingId === it.uid ? "opacity-50" : ""} rounded-xl`}
                      style={{ left: `${it.x}%`, top: `${it.y}%`, transform: `translate(-50%,-50%) scale(${it.scale})` }}
                    >
                      <ProductThumb product={it.product} size={96} />
                      {selectedUid === it.uid && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white border border-black/10 rounded-full shadow-md px-1 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setPlaced((p) => p.map((x) => x.uid === it.uid ? { ...x, scale: Math.max(0.4, x.scale - 0.1) } : x)); }}
                            className="size-7 rounded-full hover:bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] text-sm font-bold"
                          >−</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPlaced((p) => p.map((x) => x.uid === it.uid ? { ...x, scale: Math.min(2.5, x.scale + 0.1) } : x)); }}
                            className="size-7 rounded-full hover:bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] text-sm font-bold"
                          >+</button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPlaced((p) => p.filter((x) => x.uid !== it.uid)); setSelectedUid(null); }}
                            className="size-7 rounded-full hover:bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] inline-flex items-center justify-center"
                          ><Trash2 className="size-3.5" /></button>
                        </div>
                      )}
                    </div>
                  ))}

                  {roomPreviewUrl && (
                    <button
                      onClick={() => {
                        setRoomPreviewUrl(null);
                        setReferenceImageUrl(null);
                        setPlaced([]);
                        setSelected([]);
                        setSelectedUid(null);
                        setStatusMessage(null);
                      }}
                      className="absolute top-3 right-3 h-9 px-3 rounded-full bg-white/90 backdrop-blur border border-black/10 text-xs font-bold text-[color:var(--istikbal-blue)] inline-flex items-center gap-1.5 hover:bg-white"
                    >
                      <RotateCcw className="size-3.5" /> {t("resetScene")}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-3 sm:px-5 lg:px-8 pb-3 lg:pb-6">
                {(lowCredit || creditsDepleted) && (
                  <div
                    className={`mb-2 rounded-xl px-3 py-2 text-xs font-semibold ${
                      creditsDepleted
                        ? "border border-red-200 bg-red-50 text-red-700"
                        : "border border-amber-200 bg-amber-50 text-amber-800"
                    }`}
                  >
                    {creditsDepleted ? t("creditsDepleted") : t("creditsLow")}
                  </div>
                )}
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="flex-1 relative min-w-0">
                    <Wand2 className="absolute left-3 lg:left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
                    <input
                      value={promptNotes}
                      onChange={(e) => setPromptNotes(e.target.value)}
                      placeholder={t("promptPlaceholder")}
                      className="w-full h-11 lg:h-12 pl-9 lg:pl-11 pr-3 lg:pr-4 rounded-full bg-white border border-black/5 focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/40"
                    />
                  </div>
                  <div className="hidden md:inline-flex h-11 lg:h-12 px-3 lg:px-4 rounded-full bg-white border border-black/5 items-center gap-2 text-xs font-bold text-[color:var(--istikbal-blue)]">
                    <Coins className="size-4 text-[color:var(--istikbal-yellow)]" />
                    <span className="text-[color:var(--istikbal-blue)]/50">{t("balanceLabel")}</span>
                    <span className="text-base">{balanceDisplay}</span>
                    <span className="text-[color:var(--istikbal-blue)]/25">·</span>
                    <span className="text-[color:var(--istikbal-blue)]/50">{t("costLabel")}</span>
                    <span className="text-base">{estimatedCost}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="hidden lg:flex shrink-0 items-center gap-2.5 h-11 lg:h-12 px-2 rounded-full bg-white border border-black/5 hover:bg-[color:var(--istikbal-blue-soft)] transition"
                  >
                    <div className="size-10 overflow-hidden rounded-xl border border-black/5 bg-[color:var(--istikbal-blue-soft)]">
                      {latestGalleryThumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={latestGalleryThumbnail}
                          alt={t("galleryLatestAlt")}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="size-4 text-[color:var(--istikbal-blue)]/40" />
                        </div>
                      )}
                    </div>
                    <span className="pr-2 text-left text-[10px] font-bold uppercase leading-tight tracking-[0.14em] text-[color:var(--istikbal-blue)]/60">
                      {t("galleryButton")}
                    </span>
                  </button>
                  <button
                    disabled={renderDisabled}
                    onClick={() => void handleRender()}
                    className="h-11 lg:h-12 px-4 lg:px-6 rounded-full bg-[color:var(--istikbal-blue)] text-white text-sm font-bold inline-flex items-center gap-2 hover:bg-[color:var(--istikbal-blue)]/90 shrink-0 disabled:opacity-60"
                  >
                    {busy === "render" ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span className="hidden sm:inline">{t("render")}</span> <ArrowUp className="size-4" />
                  </button>
                </div>
              </div>
            </main>

            {showRenderGallery ? (
              <aside className="mt-2 mx-3 sm:mx-5 lg:mx-0 lg:mt-0 mb-3 lg:mb-0 flex max-h-[min(360px,52vh)] w-auto shrink-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:h-full lg:max-h-none lg:w-[280px] lg:rounded-none lg:border-0 lg:border-l lg:shadow-none">
                <div className="flex items-center justify-between px-4 py-4">
                  <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[color:var(--istikbal-blue)]">
                    {t("galleryTitle")}
                  </h2>
                  {isDesktopViewport ? (
                    <button
                      type="button"
                      onClick={() => setIsGalleryOpen(false)}
                      className="rounded-lg p-1 transition-colors hover:bg-[color:var(--istikbal-blue-soft)]"
                    >
                      <X className="size-4 text-[color:var(--istikbal-blue)]/50" />
                    </button>
                  ) : null}
                </div>

                {galleryError && (
                  <div className="mx-3 mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {galleryError}
                  </div>
                )}

                <div
                  ref={setGalleryScrollEl}
                  className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 pb-4"
                >
                  {galleryLoading && historyPanelItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-[color:var(--istikbal-blue)]/50">
                      <Loader2 className="mb-2 size-6 animate-spin opacity-60" />
                      <p className="text-xs">{t("galleryLoading")}</p>
                    </div>
                  ) : historyPanelItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-[color:var(--istikbal-blue)]/50">
                      <Eye className="mb-2 size-8 opacity-40" />
                      <p className="text-xs">{t("galleryEmpty")}</p>
                    </div>
                  ) : (
                    historyPanelItems.map((item, index) => {
                      const previewUrl =
                        resolveGenerationImageUrl(item) || item.thumbnailUrl || "";
                      const status = (item.status ?? "").toUpperCase();
                      const isDone = status === "COMPLETED" && Boolean(previewUrl);
                      const isProcessing =
                        status === "PENDING" || status === "PROCESSING";

                      return (
                        <div
                          key={item.id || `${previewUrl}-${index}`}
                          className={`group relative overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-all ${
                            isDone ? "cursor-pointer hover:border-[color:var(--istikbal-blue)]/30" : ""
                          }`}
                          onClick={() => {
                            if (isDone) applyGalleryItem(item);
                          }}
                        >
                          {isDone ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={previewUrl}
                                alt={item.caption || t("galleryTitle")}
                                className="aspect-[4/3] w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/20 group-hover:opacity-100">
                                <div className="rounded-full bg-white/95 p-2 shadow-lg">
                                  <Eye className="size-4 text-[color:var(--istikbal-blue)]" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="relative flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-[color:var(--istikbal-blue-soft)] px-4 text-center">
                              <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-[color:var(--istikbal-blue)]/10 via-transparent to-transparent" />
                              <div className="relative flex size-14 items-center justify-center rounded-2xl bg-[color:var(--istikbal-blue)]/10">
                                <Sparkles className="size-7 text-[color:var(--istikbal-blue)]" />
                                {isProcessing ? (
                                  <Loader2 className="absolute -right-1 -top-1 size-4 animate-spin text-[color:var(--istikbal-blue)]" />
                                ) : null}
                              </div>
                              <div className="relative">
                                <p className="text-xs font-bold text-[color:var(--istikbal-blue)]">
                                  {isProcessing
                                    ? t("galleryProcessing")
                                    : t("galleryFailed")}
                                </p>
                                <p className="mt-0.5 text-[10px] text-[color:var(--istikbal-blue)]/55">
                                  {status === "PENDING"
                                    ? t("galleryQueued")
                                    : status === "FAILED" ||
                                        status === "ERROR" ||
                                        status === "CANCELLED"
                                      ? t("galleryFailedHint")
                                      : t("galleryProcessingHint")}
                                </p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-semibold text-[color:var(--istikbal-blue)]">
                                {item.prompt || t("galleryUntitled")}
                              </div>
                              <div className="text-[10px] text-[color:var(--istikbal-blue)]/50">
                                {formatGalleryTimestamp(item, t("galleryJustNow"))}
                              </div>
                            </div>
                            {isDone && previewUrl ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title={t("galleryOpen")}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    applyGalleryItem(item);
                                  }}
                                  className="rounded-lg p-2 transition-colors hover:bg-[color:var(--istikbal-blue-soft)]"
                                >
                                  <Eye className="size-4 text-[color:var(--istikbal-blue)]/50" />
                                </button>
                                <a
                                  href={previewUrl}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  title={t("galleryDownload")}
                                  className="rounded-lg p-2 transition-colors hover:bg-[color:var(--istikbal-blue-soft)]"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Download className="size-4 text-[color:var(--istikbal-blue)]/50" />
                                </a>
                              </div>
                            ) : null}
                          </div>

                          <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border border-black/10 bg-white/85 text-[10px] font-bold text-[color:var(--istikbal-blue)]/60 backdrop-blur-sm">
                            {index + 1}
                          </div>
                        </div>
                      );
                    })
                  )}

                  <InfiniteScrollSentinel
                    sentinelRef={gallerySentinelRef}
                    hasMore={galleryHasMore}
                    loadingMore={galleryLoadingMore}
                  />
                </div>
              </aside>
            ) : null}
            </div>
          </>
        );
      })()}
      </div>

      {pickerOpen && (
        <ProductPicker
          mode={productTab}
          initialCategoryId={pickerCategoryId}
          initialCollectionId={pickerCollectionId}
          onSelectProduct={(product) => {
            addProductToSidebar(product);
            setPickerOpen(false);
            setPickerCategoryId(null);
            setPickerCollectionId(null);
          }}
          onClose={() => {
            setPickerOpen(false);
            setPickerCategoryId(null);
            setPickerCollectionId(null);
          }}
        />
      )}

      {qrOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setQrOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-3 right-3 size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[color:var(--istikbal-blue)]/60"
            >
              <X className="size-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="size-4 text-[color:var(--istikbal-blue)]" />
              <h3 className="text-xs font-extrabold tracking-[0.18em] text-[color:var(--istikbal-blue)]">{t("qrTitle")}</h3>
            </div>
            <p className="text-xs text-[color:var(--istikbal-blue)]/60">
              {t("qrHint")}
            </p>
            <div className="mt-5 flex flex-col items-center">
              <div className="p-3 bg-white border border-black/10 rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl} alt={t("qrAlt")} width={240} height={240} className="block" />
              </div>
              <div className="mt-3 text-[10px] font-mono text-[color:var(--istikbal-blue)]/50 break-all text-center px-2">
                {mobileUploadUrl}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-black/5">
              <button
                onClick={() => qrUploadInputRef.current?.click()}
                className="w-full h-11 rounded-full bg-white border border-black/10 text-[color:var(--istikbal-blue)] text-xs font-bold inline-flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-blue-soft)]"
              >
                <Upload className="size-4" /> {t("qrManualUpload")}
              </button>
              <input
                ref={qrUploadInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void onRoomUpload(e.target.files?.[0]);
                  setQrOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      <QuoteOfferSheet
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        draft={quoteDraft}
        onDraftChange={setQuoteDraft}
      />
    </div>
  );
}

function Section({
  title, icon, open, onToggle, children, badge,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  badge?: number;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white">
      <button
        onClick={onToggle}
        className="w-full px-4 h-12 flex items-center justify-between text-sm font-bold text-[color:var(--istikbal-blue)]"
      >
        <span className="inline-flex items-center gap-2">
          {icon}
          {title}
          {badge != null && badge > 0 && (
            <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[color:var(--istikbal-blue)] text-white text-[10px] font-extrabold">
              {badge}
            </span>
          )}
        </span>
        {open ? <ChevronUp className="size-4 opacity-60" /> : <ChevronDown className="size-4 opacity-60" />}
      </button>
      {open && children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function ModeCard({
  active, onClick, icon, title, subtitle,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-4 text-center transition border ${
        active
          ? "bg-[color:var(--istikbal-blue)] text-white border-[color:var(--istikbal-blue)] shadow-sm"
          : "bg-white text-[color:var(--istikbal-blue)] border-black/5 hover:border-[color:var(--istikbal-blue)]/30"
      }`}
    >
      <div className={`mx-auto mb-2 size-9 rounded-full flex items-center justify-center ${active ? "bg-white/20" : "bg-[color:var(--istikbal-blue-soft)]"}`}>
        {icon}
      </div>
      <div className="text-[11px] font-extrabold tracking-[0.12em]">{title}</div>
      <div className={`mt-1 text-[10px] ${active ? "text-white/80" : "text-[color:var(--istikbal-blue)]/55"}`}>{subtitle}</div>
    </button>
  );
}

function ProductThumb({ product, size = 80 }: { product: CatalogProduct; size?: number }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${FALLBACK_THUMB} border border-white shadow-md overflow-hidden relative`}
      style={{ width: size, height: size }}
    >
      {product.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={product.thumbnailUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-x-1 bottom-1 rounded-md bg-white/70 px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--istikbal-blue)] truncate text-center">
        {product.name}
      </div>
    </div>
  );
}

function ProductPicker({
  onClose,
  onSelectProduct,
  mode = "all",
  initialCategoryId = null,
  initialCollectionId = null,
}: {
  onClose: () => void;
  onSelectProduct: (product: CatalogProduct) => void;
  mode?: "all" | "collections" | "categories";
  initialCategoryId?: string | null;
  initialCollectionId?: string | null;
}) {
  const t = useTranslations("aiStudio");
  const tCommon = useTranslations("common");
  const tCatalog = useTranslations("catalog");
  const [q, setQ] = useState("");
  const [col, setCol] = useState<string | null>(initialCollectionId);
  const [cat, setCat] = useState<string | null>(initialCategoryId);
  const [pickerScrollEl, setPickerScrollEl] = useState<HTMLDivElement | null>(null);
  const { collections, categories, loading: filtersLoading, error: filtersError } = useCatalogFilters();

  const entityQuery = q.trim().toLocaleLowerCase("tr");
  const filteredCategories = useMemo(() => {
    if (!entityQuery) return categories;
    return categories.filter((c) => c.name.toLocaleLowerCase("tr").includes(entityQuery));
  }, [categories, entityQuery]);
  const filteredCollections = useMemo(() => {
    if (!entityQuery) return collections;
    return collections.filter((c) => c.name.toLocaleLowerCase("tr").includes(entityQuery));
  }, [collections, entityQuery]);

  /** Product name search only in "all"; category/collection tabs search entities via chips. */
  const productQuery = mode === "all" ? q : "";
  const {
    products,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
  } = useProductSearch({
    query: productQuery,
    collectionId: mode === "categories" ? null : col,
    categoryId: mode === "collections" ? null : cat,
    size: 40,
  });

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading: loading || loadingMore,
    onLoadMore: loadMore,
    root: pickerScrollEl,
  });

  useEffect(() => {
    setCat(initialCategoryId);
  }, [initialCategoryId]);

  useEffect(() => {
    setCol(initialCollectionId);
  }, [initialCollectionId]);

  const searchPlaceholder =
    mode === "categories"
      ? t("searchCategoryPlaceholder")
      : mode === "collections"
        ? t("searchCollectionPlaceholder")
        : t("searchProductPlaceholder");

  const helpText =
    mode === "categories"
      ? t("pickerHelpCategories")
      : mode === "collections"
        ? t("pickerHelpCollections")
        : t("pickerHelpAll");

  const displayError = filtersError
    ? tCatalog("filtersLoadError")
    : error
      ? tCatalog("productsLoadError")
      : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center p-6 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black/5 flex items-start justify-between gap-4">
          <p className="text-sm text-[color:var(--istikbal-blue)]/80 max-w-2xl">
            {helpText}
          </p>
          <button onClick={onClose} className="size-9 rounded-full border border-black/10 text-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue-soft)] inline-flex items-center justify-center">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pt-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-[color:var(--istikbal-blue-soft)] border border-black/5 focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/20 outline-none text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/40"
            />
          </div>
        </div>

        <div className="px-6 pt-5 space-y-3 text-sm">
          {(mode === "all" || mode === "categories") && (
            <FilterRow
              label={t("filterCategory")}
              allLabel={tCommon("all")}
              items={filteredCategories.map((c) => ({ id: c.id, label: c.name }))}
              active={cat}
              onSelect={setCat}
            />
          )}
          {(mode === "all" || mode === "collections") && (
            <FilterRow
              label={t("filterCollection")}
              allLabel={tCommon("all")}
              items={filteredCollections.map((c) => ({ id: c.id, label: c.name }))}
              active={col}
              onSelect={setCol}
            />
          )}
        </div>

        <div
          ref={setPickerScrollEl}
          className="px-6 py-6 max-h-[60vh] overflow-y-auto"
        >
          {displayError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {displayError}
            </div>
          )}
          {((loading && products.length === 0) || filtersLoading) ? (
            <div className="py-16 flex flex-col items-center gap-3 text-sm text-[color:var(--istikbal-blue)]/60">
              <Loader2 className="size-6 animate-spin" />
              {t("productsLoading")}
            </div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-sm text-[color:var(--istikbal-blue)]/60">
              {t("noMatchingProducts")}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <PickerCard
                    key={p.id}
                    product={p}
                    onSelect={() => onSelectProduct(p)}
                  />
                ))}
              </div>
              <InfiniteScrollSentinel
                sentinelRef={sentinelRef}
                hasMore={hasMore}
                loadingMore={loadingMore}
              />
            </>
          )}
          <p className="mt-6 text-xs text-[color:var(--istikbal-blue)]/50 text-center">
            {t("pickerTip")}
          </p>
        </div>
      </div>
    </div>
  );
}

function FilterRow({
  label, allLabel, items, active, onSelect,
}: {
  label: string;
  allLabel: string;
  items: Array<{ id: string; label: string }>;
  active: string | null;
  onSelect: (v: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-[10px] font-extrabold tracking-[0.18em] text-[color:var(--istikbal-blue)]/40 w-24 shrink-0">{label}:</span>
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={`text-xs font-bold px-2 py-1 rounded ${active === null ? "text-[color:var(--istikbal-blue)] underline" : "text-[color:var(--istikbal-blue)]/40 hover:text-[color:var(--istikbal-blue)]"}`}
      >{allLabel}</button>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onSelect(it.id === active ? null : it.id)}
          className={`text-xs font-bold px-2 py-1 rounded ${active === it.id ? "text-[color:var(--istikbal-blue)] underline" : "text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"}`}
        >{it.label}</button>
      ))}
    </div>
  );
}

function PickerCard({
  product,
  onSelect,
}: {
  product: CatalogProduct;
  onSelect: () => void;
}) {
  const t = useTranslations("aiStudio");
  const tCommon = useTranslations("common");
  const draggedRef = useRef(false);

  return (
    <button
      type="button"
      draggable
      onClick={() => {
        if (draggedRef.current) {
          draggedRef.current = false;
          return;
        }
        onSelect();
      }}
      onDragStart={(e) => {
        draggedRef.current = true;
        e.dataTransfer.setData(PRODUCT_MIME, JSON.stringify(product));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onDragEnd={() => {
        // Keep flag until click handler runs (or clear shortly if no click).
        window.setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }}
      className="group rounded-xl border border-black/5 bg-white p-3 hover:shadow-lg hover:-translate-y-0.5 transition cursor-pointer text-left w-full"
      title={t("pickerCardTitle")}
    >
      <div className={`aspect-square rounded-lg bg-gradient-to-br ${FALLBACK_THUMB} overflow-hidden relative flex items-center justify-center text-[color:var(--istikbal-blue)]/30 text-xs font-semibold`}>
        {product.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnailUrl} alt={product.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          tCommon("noImage")
        )}
      </div>
      <div className="mt-3 text-center text-xs font-bold text-[color:var(--istikbal-blue)] line-clamp-2 min-h-[2.5rem]">
        {product.name}
      </div>
    </button>
  );
}

export default AiStudioPage;
