"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ExternalLink,
  Loader2,
  Plus,
  Search,
  Trash2,
  FileText,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { PortalCrmError } from "@/lib/portal-crm";
import {
  createOfferWithPreview,
  formatCustomerLabel,
  quickCreateCustomer,
  resolveCustomerId,
  searchCustomersCompletion,
  type CreateOfferResult,
  type CustomerSearchHit,
  type QuoteDraft,
  type QuoteLineItem,
} from "@/lib/offers";
import { defaultLocale, isAppLocale } from "@/i18n/config";

type QuoteOfferSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draft: QuoteDraft | null;
  onDraftChange?: (draft: QuoteDraft) => void;
};

export function QuoteOfferSheet({
  open,
  onOpenChange,
  draft,
  onDraftChange,
}: QuoteOfferSheetProps) {
  const t = useTranslations("offers");
  const router = useRouter();
  const locale = useLocale();
  const language = isAppLocale(locale) ? locale : defaultLocale;

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateOfferResult | null>(null);

  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");
  const [showQuickCreate, setShowQuickCreate] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    setQuery("");
    setHits([]);
    setShowQuickCreate(false);
    setNewPhone("");
    setNewName("");
  }, [open, draft?.section.name, draft?.lines.length]);

  useEffect(() => {
    if (!open || !query.trim()) {
      setHits([]);
      return;
    }
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setSearching(true);
      void searchCustomersCompletion(query, 8, router)
        .then((list) => {
          if (!cancelled) setHits(list ?? []);
        })
        .catch((err) => {
          if (cancelled) return;
          if (err instanceof PortalCrmError && err.status === 401) return;
          setError(err instanceof Error ? err.message : t("customerSearchError"));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query, router, t]);

  const lines = draft?.lines ?? [];
  const lineTotal = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const patchDraft = useCallback(
    (patch: Partial<QuoteDraft>) => {
      if (!draft || !onDraftChange) return;
      onDraftChange({ ...draft, ...patch });
    },
    [draft, onDraftChange],
  );

  const selectCustomer = (hit: CustomerSearchHit) => {
    const id = resolveCustomerId(hit);
    if (!id || !draft) return;
    patchDraft({
      customerId: id,
      customerLabel: formatCustomerLabel(hit),
    });
    setQuery("");
    setHits([]);
    setShowQuickCreate(false);
  };

  const removeLine = (index: number) => {
    if (!draft || !onDraftChange) return;
    onDraftChange({
      ...draft,
      lines: draft.lines.filter((_, i) => i !== index),
    });
  };

  const handleQuickCreate = async () => {
    if (!draft) return;
    const phone = newPhone.trim();
    if (!phone) {
      setError(t("phoneRequired"));
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const created = await quickCreateCustomer(
        {
          phoneNumber: phone,
          fullName: newName.trim() || undefined,
          firstName: newName.trim().split(/\s+/)[0] || undefined,
          lastName: newName.trim().split(/\s+/).slice(1).join(" ") || undefined,
        },
        router,
      );
      const label = [created.firstName, created.lastName].filter(Boolean).join(" ")
        || created.customerCompanyName
        || created.phoneNumber
        || created.id;
      patchDraft({
        customerId: created.id,
        customerLabel: label,
      });
      setShowQuickCreate(false);
      setNewPhone("");
      setNewName("");
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("customerCreateError"));
    } finally {
      setCreating(false);
    }
  };

  const handleSubmit = async () => {
    if (!draft) return;
    if (!draft.customerId) {
      setError(t("customerRequired"));
      return;
    }
    if (!draft.lines.length) {
      setError(t("linesRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: QuoteDraft = {
        ...draft,
        language: draft.language || language,
      };
      const created = await createOfferWithPreview(payload, router);
      setResult(created);
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      setError(err instanceof Error ? err.message : t("createError"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto bg-white p-0"
      >
        <SheetHeader className="border-b border-black/5 px-5 py-4 text-left">
          <SheetTitle className="text-[color:var(--istikbal-blue)]">
            {result ? t("successTitle") : t("title")}
          </SheetTitle>
          <SheetDescription className="text-[color:var(--istikbal-blue)]/60">
            {result
              ? t("successHint", {
                  number: result.offer.offerNumber || result.offer.id.slice(0, 8),
                })
              : t("subtitle")}
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-4 space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {result ? (
            <SuccessPanel result={result} lines={lines} />
          ) : (
            <>
              <section className="space-y-2">
                <h3 className="text-xs font-extrabold tracking-[0.14em] text-[color:var(--istikbal-blue)]/50">
                  {t("customerSection")}
                </h3>
                {draft?.customerId ? (
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--istikbal-blue)]/5 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[color:var(--istikbal-blue)] truncate">
                        {draft.customerLabel || draft.customerId}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"
                      onClick={() =>
                        patchDraft({ customerId: null, customerLabel: null })
                      }
                    >
                      {t("changeCustomer")}
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t("customerSearchPlaceholder")}
                        className="w-full h-11 rounded-xl border border-black/10 bg-white pl-10 pr-3 text-sm text-[color:var(--istikbal-blue)] outline-none focus:border-[color:var(--istikbal-blue)]/40"
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-[color:var(--istikbal-blue)]/40" />
                      )}
                    </div>
                    {hits.length > 0 && (
                      <ul className="rounded-xl border border-black/5 overflow-hidden divide-y divide-black/5">
                        {hits.map((hit) => {
                          const id = resolveCustomerId(hit);
                          if (!id) return null;
                          return (
                            <li key={id}>
                              <button
                                type="button"
                                onClick={() => selectCustomer(hit)}
                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-[color:var(--istikbal-blue)]/5"
                              >
                                <span className="font-semibold text-[color:var(--istikbal-blue)]">
                                  {formatCustomerLabel(hit)}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {!showQuickCreate ? (
                      <button
                        type="button"
                        onClick={() => setShowQuickCreate(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--istikbal-blue)]"
                      >
                        <Plus className="size-3.5" /> {t("quickCreate")}
                      </button>
                    ) : (
                      <div className="space-y-2 rounded-xl border border-black/5 p-3">
                        <input
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          placeholder={t("quickCreateName")}
                          className="w-full h-10 rounded-lg border border-black/10 px-3 text-sm outline-none"
                        />
                        <input
                          value={newPhone}
                          onChange={(e) => setNewPhone(e.target.value)}
                          placeholder={t("quickCreatePhone")}
                          className="w-full h-10 rounded-lg border border-black/10 px-3 text-sm outline-none"
                        />
                        <button
                          type="button"
                          disabled={creating}
                          onClick={() => void handleQuickCreate()}
                          className="w-full h-10 rounded-lg bg-[color:var(--istikbal-blue)] text-white text-sm font-bold disabled:opacity-50"
                        >
                          {creating ? (
                            <Loader2 className="size-4 animate-spin mx-auto" />
                          ) : (
                            t("quickCreateSubmit")
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="space-y-2">
                <h3 className="text-xs font-extrabold tracking-[0.14em] text-[color:var(--istikbal-blue)]/50">
                  {t("linesSection")}
                </h3>
                {lines.length === 0 ? (
                  <p className="text-sm text-[color:var(--istikbal-blue)]/50">
                    {t("linesEmpty")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {lines.map((line, index) => (
                      <LineRow
                        key={`${line.productId}-${index}`}
                        line={line}
                        onRemove={
                          onDraftChange ? () => removeLine(index) : undefined
                        }
                      />
                    ))}
                  </ul>
                )}
                <p className="text-sm font-bold text-[color:var(--istikbal-blue)] text-right">
                  {t("subtotal")}: {lineTotal.toLocaleString(language)}{" "}
                  {draft?.currency || "TRY"}
                </p>
              </section>

              <button
                type="button"
                disabled={submitting || !draft?.customerId || lines.length === 0}
                onClick={() => void handleSubmit()}
                className="w-full h-12 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                {t("submit")}
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function LineRow({
  line,
  onRemove,
}: {
  line: QuoteLineItem;
  onRemove?: () => void;
}) {
  return (
    <li className="rounded-xl border border-black/5 bg-[color:var(--istikbal-blue)]/5 px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[color:var(--istikbal-blue)] truncate">
            {line.name}
          </p>
          <p className="text-[11px] text-[color:var(--istikbal-blue)]/55">
            ×{line.quantity} · {line.price.toLocaleString()} {line.currency}
          </p>
          {line.note ? (
            <p className="mt-1 text-[11px] text-[color:var(--istikbal-blue)]/70 leading-snug">
              {line.note}
            </p>
          ) : null}
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-[color:var(--istikbal-blue)]/40 hover:text-red-600"
            aria-label="Remove"
          >
            <Trash2 className="size-3.5" />
          </button>
        ) : null}
      </div>
    </li>
  );
}

function SuccessPanel({
  result,
  lines,
}: {
  result: CreateOfferResult;
  lines: QuoteLineItem[];
}) {
  const t = useTranslations("offers");
  const offer = result.offer;
  const products =
    offer.sections?.flatMap((s) => s.products ?? []) ??
    lines.map((l) => ({
      name: l.name,
      quantity: l.quantity,
      price: l.price,
      note: l.note,
    }));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4 space-y-1">
        <p className="text-xs font-bold text-[color:var(--istikbal-blue)]/50">
          {t("offerNumber")}
        </p>
        <p className="text-lg font-extrabold text-[color:var(--istikbal-blue)]">
          {offer.offerNumber || offer.id}
        </p>
        <p className="text-sm text-[color:var(--istikbal-blue)]/70">
          {t("status")}: {offer.status || "PENDING"}
        </p>
        {typeof offer.totalPrice === "number" && (
          <p className="text-sm font-bold text-[color:var(--istikbal-blue)]">
            {t("total")}: {offer.totalPrice.toLocaleString()} {offer.currency}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-extrabold tracking-[0.14em] text-[color:var(--istikbal-blue)]/50">
          {t("draftPreview")}
        </h3>
        <ul className="space-y-2">
          {products.map((p, i) => (
            <li
              key={i}
              className="rounded-xl border border-black/5 px-3 py-2 text-sm text-[color:var(--istikbal-blue)]"
            >
              <span className="font-semibold">{p.name}</span>
              {p.quantity != null ? (
                <span className="text-[color:var(--istikbal-blue)]/55">
                  {" "}
                  ×{p.quantity}
                </span>
              ) : null}
              {p.note ? (
                <p className="text-[11px] text-[color:var(--istikbal-blue)]/60 mt-0.5">
                  {p.note}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        {result.shareUrl ? (
          <a
            href={result.shareUrl}
            target="_blank"
            rel="noreferrer"
            className="h-11 rounded-xl bg-[color:var(--istikbal-blue)] text-white text-sm font-bold flex items-center justify-center gap-2"
          >
            <ExternalLink className="size-4" /> {t("viewShare")}
          </a>
        ) : null}
        {result.editUrl ? (
          <a
            href={result.editUrl}
            target="_blank"
            rel="noreferrer"
            className="h-11 rounded-xl border border-[color:var(--istikbal-blue)]/20 text-[color:var(--istikbal-blue)] text-sm font-bold flex items-center justify-center gap-2"
          >
            <FileText className="size-4" /> {t("editInCrm")}
          </a>
        ) : null}
      </div>
    </div>
  );
}
