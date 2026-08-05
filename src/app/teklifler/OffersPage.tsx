"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, FileText, Loader2, Search, Sofa } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { AppHeader } from "@/components/AppHeader";
import {
  buildOfferEditUrl,
  searchOffers,
  type OfferSearchResponse,
} from "@/lib/offers";
import { getPortalSessionView, PortalCrmError } from "@/lib/portal-crm";
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

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

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
  const [companySlug, setCompanySlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPortalSessionView()
      .then((session) => {
        if (!cancelled && session?.companySlug) {
          setCompanySlug(session.companySlug);
        }
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <div className="flex min-h-dvh flex-col bg-[color:var(--istikbal-bg)]">
      <AppHeader title={t("listTitle").toUpperCase()} backHref="/" />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-5 sm:px-6 lg:px-8">
        <p className="mb-4 text-sm text-[color:var(--istikbal-blue)]/60">
          {t("listSubtitle")}
        </p>

        <div className="relative mb-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("listSearchPlaceholder")}
            className="h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-4 text-sm text-[color:var(--istikbal-blue)] outline-none ring-[color:var(--istikbal-yellow)]/40 placeholder:text-[color:var(--istikbal-blue)]/40 focus:ring-2"
          />
        </div>

        {loading && (
          <div className="flex flex-1 items-center justify-center gap-2 py-16 text-sm text-[color:var(--istikbal-blue)]/50">
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
            <FileText className="size-10 text-[color:var(--istikbal-blue)]/25" />
            <p className="text-sm font-medium text-[color:var(--istikbal-blue)]/50">
              {t("listEmpty")}
            </p>
          </div>
        )}

        {!loading && !error && offers.length > 0 && (
          <ul className="space-y-2">
            {offers.map((offer) => {
              const viewHref = companySlug
                ? buildOfferEditUrl(offer.id, companySlug)
                : null;
              return (
                <li
                  key={offer.id}
                  className="rounded-2xl border border-black/5 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--istikbal-blue)]/5 text-[color:var(--istikbal-blue)]">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="truncate text-sm font-bold text-[color:var(--istikbal-blue)]">
                          {offer.title?.trim() || t("listUntitled")}
                        </p>
                        {offer.offerNumber && (
                          <span className="shrink-0 text-[11px] font-semibold text-[color:var(--istikbal-blue)]/45">
                            #{offer.offerNumber}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[color:var(--istikbal-blue)]/55">
                        {offer.customerName?.trim() || t("listCustomerUnknown")}
                        {" · "}
                        {formatDate(offer.createdAt, bcp47)}
                      </p>
                      <p className="mt-1 text-sm font-bold text-[color:var(--istikbal-blue)]">
                        {formatMoney(offer.totalPrice, offer.currency, bcp47)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {viewHref ? (
                      <a
                        href={viewHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[color:var(--istikbal-blue)]/15 bg-white px-2 text-xs font-bold text-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/5"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">{t("listViewOffer")}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[color:var(--istikbal-blue)]/10 px-2 text-xs font-bold text-[color:var(--istikbal-blue)]/35"
                      >
                        <ExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">{t("listViewOffer")}</span>
                      </button>
                    )}
                    <Link
                      href={`/oda?offerId=${encodeURIComponent(offer.id)}`}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[color:var(--istikbal-blue)] px-2 text-xs font-bold text-white hover:bg-[color:var(--istikbal-navy)]"
                    >
                      <Sofa className="size-3.5 shrink-0" />
                      <span className="truncate">{t("listGoToDesign")}</span>
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}

export default OffersPage;
