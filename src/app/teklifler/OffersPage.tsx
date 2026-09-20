"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Search, Sofa } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppHeader } from "@/components/AppHeader";
import { searchOffers, type OfferSearchResponse } from "@/lib/offers";
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

function formatDateTime(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(date);
}

const STATUS_MESSAGE_KEYS: Record<string, string> = {
  QUOTE_REQUESTED: "statusQuoteRequested",
  PENDING: "statusPending",
  REOPENED: "statusReopened",
  ACCEPTED: "statusAccepted",
  ON_PRODUCTION: "statusOnProduction",
  ON_DELIVERY: "statusOnDelivery",
  DELIVERED: "statusDelivered",
  COMPLETED: "statusCompleted",
  ORDERED: "statusOrdered",
  REJECTED: "statusRejected",
  CANCELLED: "statusCancelled",
};

function OffersPage() {
  const router = useRouter();
  const t = useTranslations("offers");
  const locale = useLocale();
  const bcp47 = toBcp47(isAppLocale(locale) ? locale : defaultLocale);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [offers, setOffers] = useState<OfferSearchResponse[]>([]);
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
        const page = await searchOffers(
          {
            query: debouncedQuery || undefined,
            page: 0,
            size: 40,
          },
          router,
        );
        if (cancelled) return;
        setOffers(page.content ?? []);
      } catch (err) {
        if (err instanceof PortalCrmError && err.status === 401) return;
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t("listLoadError"));
          setOffers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, router, t]);

  return (
    <div className="flex min-h-dvh flex-col bg-[color:var(--brand-bg)]">
      <AppHeader title={t("listTitle").toUpperCase()} backHref="/" />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-[color:var(--brand-primary)]/60">
          {t("listSubtitle")}
        </p>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--brand-primary)]/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("listSearchPlaceholder")}
            className="h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 text-sm text-[color:var(--brand-primary)] outline-none ring-[color:var(--brand-accent)]/40 placeholder:text-[color:var(--brand-primary)]/40 focus:ring-2"
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-[color:var(--brand-primary)]/50">
            <Loader2 className="size-5 animate-spin" />
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && offers.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
            <FileText className="size-10 text-[color:var(--brand-primary)]/25" />
            <p className="text-sm font-medium text-[color:var(--brand-primary)]/50">
              {t("listEmpty")}
            </p>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[72rem] text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-black/8 bg-white text-left text-[11px] font-extrabold tracking-[0.08em] text-[color:var(--brand-primary)]/45">
                    <th className="px-4 py-3">{t("listColumnNo")}</th>
                    <th className="px-4 py-3">{t("listColumnTitle")}</th>
                    <th className="px-4 py-3">{t("listColumnCustomer")}</th>
                    <th className="px-4 py-3">{t("listColumnStatus")}</th>
                    <th className="px-4 py-3 text-right">{t("listColumnTotal")}</th>
                    <th className="px-4 py-3">{t("listColumnCreated")}</th>
                    <th className="px-4 py-3">{t("listColumnUpdated")}</th>
                    <th className="px-4 py-3">{t("listColumnCreatedBy")}</th>
                    <th className="px-4 py-3 text-right">{t("listColumnActions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer, index) => {
                    const statusKey =
                      (offer.status && STATUS_MESSAGE_KEYS[offer.status]) ||
                      "statusPending";
                    return (
                    <tr
                      key={offer.id}
                      className={`border-b border-black/5 last:border-b-0 hover:bg-[color:var(--brand-primary)]/[0.04] ${
                        index % 2 === 1 ? "bg-[color:var(--brand-primary)]/[0.02]" : "bg-white"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[color:var(--brand-primary)]">
                        {offer.offerNumber ? `#${offer.offerNumber}` : "—"}
                      </td>
                      <td className="max-w-[16rem] px-4 py-3">
                        <p className="truncate font-semibold text-[color:var(--brand-primary)]">
                          {offer.title?.trim() || t("listUntitled")}
                        </p>
                      </td>
                      <td className="max-w-[11rem] truncate px-4 py-3 text-[color:var(--brand-primary)]/70">
                        {offer.customerName?.trim() || t("listCustomerUnknown")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-full bg-[color:var(--brand-primary)]/8 px-2 py-0.5 text-[11px] font-bold text-[color:var(--brand-primary)]">
                          {t(statusKey)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums font-semibold text-[color:var(--brand-primary)]">
                        {formatMoney(offer.totalPrice, offer.currency, bcp47)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[color:var(--brand-primary)]/70">
                        {formatDateTime(offer.createdAt, bcp47)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[color:var(--brand-primary)]/70">
                        {formatDateTime(offer.updatedAt, bcp47)}
                      </td>
                      <td className="max-w-[10rem] truncate px-4 py-3 text-[color:var(--brand-primary)]/70">
                        {offer.createdByName?.trim() || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/teklifler/${encodeURIComponent(offer.id)}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-[color:var(--brand-primary)]/15 px-2.5 text-xs font-bold text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5"
                          >
                            <FileText className="size-3.5" />
                            {t("listViewOffer")}
                          </Link>
                          <Link
                            href={`/oda?offerId=${encodeURIComponent(offer.id)}`}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-[color:var(--brand-primary)] px-2.5 text-xs font-bold text-white hover:bg-[color:var(--brand-primary-strong)]"
                          >
                            <Sofa className="size-3.5" />
                            {t("listGoToDesign")}
                          </Link>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default OffersPage;
