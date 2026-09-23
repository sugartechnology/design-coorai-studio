"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileText, Loader2, Plus, Sofa, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppHeader } from "@/components/AppHeader";
import {
  OfferCustomerPicker,
  type OfferCustomerChoice,
} from "@/components/offers/OfferCustomerPicker";
import {
  downloadOfferPdf,
  getOfferById,
  toOfferProductUpdateRequest,
  toOfferUpdateRequest,
  updateOffer,
  updateOfferProduct,
  type OfferImageResponse,
  type OfferProductResponse,
  type OfferResponse,
  type OfferSectionResponse,
} from "@/lib/offers";
import { uploadPortalFile } from "@/lib/files/upload";
import { PortalCrmError } from "@/lib/portal-crm";
import { defaultLocale, isAppLocale, toBcp47 } from "@/i18n/config";

function formatMoney(
  amount: number | undefined,
  currency: string | undefined,
  locale: string,
): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency || ""}`.trim();
  }
}

function customerLabel(offer: OfferResponse, fallback: string): string {
  const customer = offer.customer;
  if (!customer) return fallback;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  const company = customer.companyName?.trim() || customer.customerCompanyName?.trim();
  const phone = customer.mobileNumber?.trim() || customer.phoneNumber?.trim();
  if (name && company) return `${name} · ${company}`;
  if (name && phone) return `${name} · ${phone}`;
  return name || company || phone || customer.email?.trim() || fallback;
}

function customerChoiceFromOffer(
  offer: OfferResponse,
  fallback: string,
): OfferCustomerChoice | null {
  const id = offer.customer?.customerId || offer.customer?.id;
  if (!id) return null;
  return { id, label: customerLabel(offer, fallback) };
}

function humanProductNote(product: OfferProductResponse): string | null {
  const fromVariants = (product.variantSelections ?? [])
    .map((selection) => {
      const option = selection.optionName?.trim();
      const value = selection.valueName?.trim();
      if (!option && !value) return "";
      return [option, value].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  if (fromVariants.length) return fromVariants.join(" · ");

  const note = product.note?.trim();
  if (!note) return null;
  const kept = note
    .replace(/\s+(?=RapidRender\s)/g, "\n")
    .replace(/\s+(?=Konfigürasyon:)/g, "\n")
    .replace(/\s+(?=Kaynak Satır ID:)/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^RapidRender\s+(Ürün|Şirket)\s+ID:/i.test(line))
    .filter((line) => !/^Kaynak Satır ID:/i.test(line))
    .map((line) => line.replace(/^Konfigürasyon:\s*/i, ""))
    .filter(Boolean);
  return kept.length ? kept.join(" · ") : null;
}

function sectionImages(section: OfferSectionResponse): OfferImageResponse[] {
  return (section.images ?? [])
    .filter((image) => image.imageUrl?.trim())
    .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0));
}

function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const offerId = decodeURIComponent(params.id ?? "").trim();
  const router = useRouter();
  const t = useTranslations("offers");
  const locale = useLocale();
  const bcp47 = toBcp47(isAppLocale(locale) ? locale : defaultLocale);

  const [offer, setOffer] = useState<OfferResponse | null>(null);
  const [customer, setCustomer] = useState<OfferCustomerChoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!offerId) {
      setError(t("detailLoadError"));
      setLoading(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await getOfferById(offerId, router);
        if (!cancelled) {
          setOffer(next);
          setCustomer(customerChoiceFromOffer(next, t("listCustomerUnknown")));
        }
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setOffer(null);
          setError(err instanceof Error ? err.message : t("detailLoadError"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [offerId, router, t]);

  const sections = useMemo(() => {
    const list = offer?.sections ?? [];
    return [...list].sort((a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0));
  }, [offer]);

  const persistOffer = async (): Promise<OfferResponse | null> => {
    if (!offer) return null;
    const saved = await updateOffer(
      offer.id,
      toOfferUpdateRequest(offer, customer?.id ?? null),
      router,
    );
    const next = saved.id ? saved : await getOfferById(offer.id, router);
    setOffer(next);
    setCustomer(customerChoiceFromOffer(next, t("listCustomerUnknown")));
    return next;
  };

  const openPdf = async () => {
    if (!offer) return;
    setPdfBusy(true);
    setError(null);
    try {
      const saved = await persistOffer();
      if (!saved) return;
      await downloadOfferPdf(saved, {
        error: t("detailPdfError"),
      });
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(
        err instanceof Error ? err.message : t("detailPdfError"),
      );
    } finally {
      setPdfBusy(false);
    }
  };

  const saveOffer = async () => {
    if (!offer) return;
    setSaving(true);
    setError(null);
    try {
      await persistOffer();
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("detailSaveError"));
    } finally {
      setSaving(false);
    }
  };

  const title =
    offer?.title?.trim() ||
    (offer?.offerNumber ? `#${offer.offerNumber}` : t("listUntitled"));

  return (
    <div className="flex min-h-dvh flex-col bg-[color:var(--brand-bg)]">
      <AppHeader title={title.toUpperCase()} backHref="/teklifler" />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-[color:var(--brand-primary)]/50">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {!loading && error && !offer && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && offer && (
          <div className="space-y-4">
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[color:var(--brand-primary)]">
                  {offer.title?.trim() || t("listUntitled")}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[color:var(--brand-primary)]/55">
                  {offer.offerNumber ? <span>#{offer.offerNumber}</span> : null}
                  <span>
                    {t("status")}: {offer.status || "PENDING"}
                  </span>
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={() => void openPdf()}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-[color:var(--brand-primary)]/15 bg-white px-3 text-xs font-bold text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 disabled:opacity-40"
                >
                  {pdfBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileText className="size-3.5 shrink-0" />
                  )}
                  {t("detailPdf")}
                </button>
                <Link
                  href={`/oda?offerId=${encodeURIComponent(offer.id)}`}
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--brand-primary)] px-3 text-xs font-bold text-white hover:bg-[color:var(--brand-primary-strong)]"
                >
                  <Sofa className="size-3.5 shrink-0" />
                  {t("listGoToDesign")}
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
              <OfferCustomerPicker
                value={customer}
                onChange={setCustomer}
                onError={setError}
              />
            </section>

            {sections.map((section, sectionIndex) => (
              <ProposalSectionMini
                key={section.id || `${section.name}-${sectionIndex}`}
                offer={offer}
                customerId={customer?.id ?? null}
                section={section}
                sectionIndex={sectionIndex}
                currency={offer.currency}
                locale={bcp47}
                onSaved={setOffer}
                onError={setError}
              />
            ))}

            <section className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-[color:var(--brand-primary)]">
                {t("total")}: {formatMoney(offer.totalPrice, offer.currency, bcp47)}
              </p>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveOffer()}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--brand-primary)] px-5 text-sm font-bold text-white hover:bg-[color:var(--brand-primary-strong)] disabled:opacity-40"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : t("detailSaveOffer")}
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function ProposalSectionMini({
  offer,
  customerId,
  section,
  sectionIndex,
  currency,
  locale,
  onSaved,
  onError,
}: {
  offer: OfferResponse;
  customerId: string | null;
  section: OfferSectionResponse;
  sectionIndex: number;
  currency?: string;
  locale: string;
  onSaved: (offer: OfferResponse) => void;
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("offers");
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const images = sectionImages(section);
  const products = section.products ?? [];
  const sectionTotal = products.reduce((sum, product) => {
    const line =
      product.totalPrice ?? (product.price ?? 0) * (product.quantity ?? 0);
    return sum + (Number.isFinite(line) ? line : 0);
  }, 0);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    onError(null);
    try {
      const uploaded: OfferImageResponse[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadPortalFile(file, router);
        uploaded.push({
          imageUrl: url,
          thumbnailUrl: url,
          imageOrder: images.length + uploaded.length,
        });
      }
      const nextSections = (offer.sections ?? []).map((item, index) => {
        const same =
          (section.id && item.id === section.id) ||
          (!section.id && index === sectionIndex);
        if (!same) return item;
        return { ...item, images: [...(item.images ?? []), ...uploaded] };
      });
      const saved = await updateOffer(
        offer.id,
        toOfferUpdateRequest({ ...offer, sections: nextSections }, customerId),
        router,
      );
      onSaved(saved);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      onError(err instanceof Error ? err.message : t("detailAddImageError"));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = async (imageIndex: number) => {
    setRemovingIndex(imageIndex);
    onError(null);
    try {
      const nextSections = (offer.sections ?? []).map((item, index) => {
        const same =
          (section.id && item.id === section.id) ||
          (!section.id && index === sectionIndex);
        if (!same) return item;
        return { ...item, images: images.filter((_, i) => i !== imageIndex) };
      });
      const saved = await updateOffer(
        offer.id,
        toOfferUpdateRequest({ ...offer, sections: nextSections }, customerId),
        router,
      );
      onSaved(saved);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      onError(err instanceof Error ? err.message : t("detailRemoveImageError"));
    } finally {
      setRemovingIndex(null);
    }
  };

  const busy = uploading || removingIndex !== null;

  return (
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 px-4 py-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.08em] text-[color:var(--brand-primary)]">
          {section.name?.trim() || `SECTION ${sectionIndex + 1}`}
        </h2>
      </div>

      <div className="border-b border-black/5 p-3">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {images.map((image, index) => (
            <li
              key={`${image.imageUrl}-${index}`}
              className="relative overflow-hidden rounded-xl border border-black/5 bg-[color:var(--brand-primary)]/5"
            >
              <button
                type="button"
                disabled={busy}
                aria-label={t("detailRemoveImage")}
                onClick={() => void removeImage(index)}
                className="absolute right-2 top-2 inline-flex size-9 items-center justify-center rounded-lg bg-white/95 text-[color:var(--brand-primary)] shadow-sm hover:bg-white disabled:opacity-40"
              >
                {removingIndex === index ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.altText || image.caption || t("detailImages")}
                className="h-80 w-full object-contain bg-white"
              />
              {image.caption ? (
                <p className="px-2 py-1.5 text-[11px] font-semibold text-[color:var(--brand-primary)]/70">
                  {image.caption}
                </p>
              ) : null}
            </li>
          ))}
          <li>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => void addImages(event.target.files)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="flex h-80 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--brand-primary)]/25 bg-[color:var(--brand-primary)]/[0.03] text-sm font-bold text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 disabled:opacity-40"
            >
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Plus className="size-5" />
              )}
              {t("detailAddImage")}
            </button>
          </li>
        </ul>
      </div>

      {products.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[color:var(--brand-primary)]/50">
          {t("linesEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-sm">
            <thead>
              <tr className="border-b border-black/8 text-left text-[11px] font-bold text-[color:var(--brand-primary)]/50">
                <th className="w-12 px-3 py-2.5">#</th>
                <th className="px-3 py-2.5">{t("detailProduct")}</th>
                <th className="w-[4.5rem] px-3 py-2.5 text-center">{t("detailQuantity")}</th>
                <th className="w-32 px-3 py-2.5 text-right">{t("detailUnitPrice")}</th>
                <th className="w-32 px-3 py-2.5 text-right">{t("detailLineTotal")}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <OfferLineRow
                  key={product.id || `${product.productId}-${index}`}
                  offerId={offer.id}
                  product={product}
                  index={index}
                  locale={locale}
                  onSaved={onSaved}
                  onError={onError}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 bg-[color:var(--brand-primary)]/[0.03]">
                <td
                  colSpan={4}
                  className="px-3 py-2.5 text-right text-[11px] font-bold text-[color:var(--brand-primary)]/50"
                >
                  {t("detailLineTotal")}
                </td>
                <td className="px-3 py-2.5 text-right text-sm font-bold tabular-nums text-[color:var(--brand-primary)]">
                  {formatMoney(sectionTotal, currency, locale)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </section>
  );
}

function OfferLineRow({
  offerId,
  product,
  index,
  locale,
  onSaved,
  onError,
}: {
  offerId: string;
  product: OfferProductResponse;
  index: number;
  locale: string;
  onSaved: (offer: OfferResponse) => void;
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("offers");
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(product.quantity ?? 1));
  const [price, setPrice] = useState(String(product.price ?? 0));
  const [saving, setSaving] = useState(false);
  const config = humanProductNote(product);
  const thumb = product.imageUrl?.trim() || null;

  useEffect(() => {
    setQuantity(String(product.quantity ?? 1));
    setPrice(String(product.price ?? 0));
  }, [product.id, product.quantity, product.price]);

  const parsedQuantity = Number(quantity);
  const parsedPrice = Number(price);
  const dirty =
    parsedQuantity !== Number(product.quantity ?? 1) ||
    parsedPrice !== Number(product.price ?? 0);

  const save = async () => {
    if (
      !product.id ||
      !dirty ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity < 0 ||
      !Number.isFinite(parsedPrice) ||
      parsedPrice < 0
    ) {
      return;
    }
    setSaving(true);
    onError(null);
    try {
      const next = await updateOfferProduct(
        offerId,
        product.id,
        toOfferProductUpdateRequest(product, {
          quantity: parsedQuantity,
          price: parsedPrice,
        }),
        router,
      );
      onSaved(next);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      onError(err instanceof Error ? err.message : t("detailLineSaveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-b border-black/5 last:border-b-0">
      <td className="px-3 py-2.5 align-middle text-xs font-semibold tabular-nums text-[color:var(--brand-primary)]/40">
        {String((product.productOrder ?? index + 1)).padStart(2, "0")}
      </td>
      <td className="px-3 py-2.5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="size-10 shrink-0 rounded-lg border border-black/5 object-cover"
            />
          ) : (
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[color:var(--brand-primary)]/5 text-[11px] font-bold text-[color:var(--brand-primary)]/40">
              {(product.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-semibold text-[color:var(--brand-primary)]">
              {product.name || product.sku || product.productId}
            </p>
            {product.sku ? (
              <p className="truncate text-[11px] text-[color:var(--brand-primary)]/40">
                {product.sku}
              </p>
            ) : null}
            {config ? (
              <p className="truncate text-xs text-[color:var(--brand-primary)]/50">{config}</p>
            ) : null}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5 align-middle text-center">
        <input
          type="number"
          min={0}
          step="1"
          aria-label={t("detailQuantity")}
          value={quantity}
          disabled={saving}
          onChange={(event) => setQuantity(event.target.value)}
          onBlur={() => void save()}
          className="mx-auto h-8 w-14 rounded-md border border-black/10 bg-white px-1 text-center text-sm text-[color:var(--brand-primary)] outline-none ring-[color:var(--brand-accent)]/40 focus:ring-2 disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5 align-middle text-right">
        <input
          type="number"
          min={0}
          step="0.01"
          aria-label={t("detailUnitPrice")}
          value={price}
          disabled={saving}
          onChange={(event) => setPrice(event.target.value)}
          onBlur={() => void save()}
          className="ml-auto h-8 w-24 rounded-md border border-black/10 bg-white px-2 text-right text-sm tabular-nums text-[color:var(--brand-primary)] outline-none ring-[color:var(--brand-accent)]/40 focus:ring-2 disabled:opacity-50"
        />
      </td>
      <td className="px-3 py-2.5 align-middle text-right tabular-nums font-semibold text-[color:var(--brand-primary)]">
        {formatMoney(
          Number.isFinite(parsedPrice) && Number.isFinite(parsedQuantity)
            ? parsedPrice * parsedQuantity
            : product.totalPrice,
          product.currency,
          locale,
        )}
      </td>
    </tr>
  );
}

export default OfferDetailPage;
