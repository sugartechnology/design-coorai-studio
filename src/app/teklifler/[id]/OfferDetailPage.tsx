"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FileText, Loader2, Sofa } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppHeader } from "@/components/AppHeader";
import {
  buildOfferShareUrl,
  createShareLink,
  getOfferById,
  toOfferProductUpdateRequest,
  updateOfferProduct,
  type OfferImageResponse,
  type OfferProductResponse,
  type OfferResponse,
} from "@/lib/offers";
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

function sectionImages(offer: OfferResponse): OfferImageResponse[] {
  return (offer.sections ?? [])
    .flatMap((section) => section.images ?? [])
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

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
        if (!cancelled) setOffer(next);
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

  const images = useMemo(() => (offer ? sectionImages(offer) : []), [offer]);
  const products = useMemo(
    () => (offer?.sections ?? []).flatMap((section) => section.products ?? []),
    [offer],
  );

  const openPdf = async () => {
    if (!offerId) return;
    setPdfBusy(true);
    setError(null);
    try {
      const share = await createShareLink(offerId, router);
      const url = buildOfferShareUrl(share.token);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("detailPdfError"));
    } finally {
      setPdfBusy(false);
    }
  };

  const title =
    offer?.title?.trim() ||
    (offer?.offerNumber ? `#${offer.offerNumber}` : t("listUntitled"));

  return (
    <div className="flex min-h-dvh flex-col bg-[color:var(--brand-bg)]">
      <AppHeader title={title.toUpperCase()} backHref="/teklifler" />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
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

            <section className="rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--brand-primary)]/5 text-[color:var(--brand-primary)]">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[color:var(--brand-primary)]">
                    {offer.title?.trim() || t("listUntitled")}
                  </p>
                  {offer.offerNumber && (
                    <p className="mt-0.5 text-xs font-semibold text-[color:var(--brand-primary)]/45">
                      #{offer.offerNumber}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[color:var(--brand-primary)]/55">
                    {t("detailCustomer")}:{" "}
                    {customerLabel(offer, t("listCustomerUnknown"))}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--brand-primary)]/55">
                    {t("status")}: {offer.status || "PENDING"}
                  </p>
                  <p className="mt-2 text-sm font-bold text-[color:var(--brand-primary)]">
                    {t("total")}:{" "}
                    {formatMoney(offer.totalPrice, offer.currency, bcp47)}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={pdfBusy}
                  onClick={() => void openPdf()}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[color:var(--brand-primary)]/15 bg-white px-2 text-xs font-bold text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 disabled:opacity-40"
                >
                  {pdfBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <FileText className="size-3.5 shrink-0" />
                  )}
                  <span className="truncate">{t("detailPdf")}</span>
                </button>
                <Link
                  href={`/oda?offerId=${encodeURIComponent(offer.id)}`}
                  className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--brand-primary)] px-2 text-xs font-bold text-white hover:bg-[color:var(--brand-primary-strong)]"
                >
                  <Sofa className="size-3.5 shrink-0" />
                  <span className="truncate">{t("listGoToDesign")}</span>
                </Link>
              </div>
            </section>

            {images.length > 0 && (
              <section className="rounded-2xl border border-black/5 bg-white px-4 py-4 shadow-sm">
                <h2 className="mb-3 text-xs font-extrabold tracking-[0.14em] text-[color:var(--brand-primary)]/50">
                  {t("detailImages")}
                </h2>
                <ul className="grid grid-cols-2 gap-2">
                  {images.map((image, index) => (
                    <li
                      key={`${image.imageUrl}-${index}`}
                      className="overflow-hidden rounded-xl border border-black/5 bg-[color:var(--brand-primary)]/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.imageUrl}
                        alt={image.altText || image.caption || t("detailImages")}
                        className="h-36 w-full object-cover"
                      />
                      {image.caption ? (
                        <p className="px-2 py-1.5 text-[11px] font-semibold text-[color:var(--brand-primary)]/70">
                          {image.caption}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="text-xs font-extrabold tracking-[0.14em] text-[color:var(--brand-primary)]/50">
                {t("linesSection")}
              </h2>
              {products.length === 0 ? (
                <p className="rounded-2xl border border-black/5 bg-white px-4 py-6 text-sm text-[color:var(--brand-primary)]/50">
                  {t("linesEmpty")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {products.map((product, index) => (
                    <OfferLineEditor
                      key={product.id || `${product.productId}-${index}`}
                      offerId={offer.id}
                      product={product}
                      locale={bcp47}
                      onSaved={setOffer}
                      onError={setError}
                    />
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

function OfferLineEditor({
  offerId,
  product,
  locale,
  onSaved,
  onError,
}: {
  offerId: string;
  product: OfferProductResponse;
  locale: string;
  onSaved: (offer: OfferResponse) => void;
  onError: (message: string | null) => void;
}) {
  const t = useTranslations("offers");
  const router = useRouter();
  const [quantity, setQuantity] = useState(String(product.quantity ?? 1));
  const [note, setNote] = useState(product.note ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuantity(String(product.quantity ?? 1));
    setNote(product.note ?? "");
  }, [product.id, product.quantity, product.note]);

  const parsedQuantity = Number(quantity);
  const dirty =
    parsedQuantity !== Number(product.quantity ?? 1) ||
    note.trim() !== (product.note ?? "").trim();

  const save = async () => {
    if (!product.id || !Number.isFinite(parsedQuantity) || parsedQuantity < 0) {
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
          note: note.trim() || null,
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
    <li className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm">
      <p className="text-sm font-semibold text-[color:var(--brand-primary)]">
        {product.name || product.sku || product.productId}
      </p>
      <p className="mt-0.5 text-xs text-[color:var(--brand-primary)]/50">
        {formatMoney(product.price, product.currency, locale)}
        {product.totalPrice != null
          ? ` · ${formatMoney(product.totalPrice, product.currency, locale)}`
          : null}
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-[7rem_1fr]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-[color:var(--brand-primary)]/45">
            {t("detailQuantity")}
          </span>
          <input
            type="number"
            min={0}
            step="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[color:var(--brand-primary)] outline-none ring-[color:var(--brand-accent)]/40 focus:ring-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-bold text-[color:var(--brand-primary)]/45">
            {t("detailNote")}
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-11 w-full rounded-xl border border-black/10 px-3 text-sm text-[color:var(--brand-primary)] outline-none ring-[color:var(--brand-accent)]/40 focus:ring-2"
          />
        </label>
      </div>
      <button
        type="button"
        disabled={!product.id || !dirty || saving}
        onClick={() => void save()}
        className="mt-3 inline-flex h-11 items-center justify-center rounded-xl bg-[color:var(--brand-primary)] px-4 text-xs font-bold text-white hover:bg-[color:var(--brand-primary-strong)] disabled:opacity-40"
      >
        {saving ? <Loader2 className="size-3.5 animate-spin" /> : t("detailSaveLine")}
      </button>
    </li>
  );
}

export default OfferDetailPage;
