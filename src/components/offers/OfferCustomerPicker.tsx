"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Search } from "lucide-react";
import { PortalCrmError } from "@/lib/portal-crm";
import {
  formatCustomerLabel,
  quickCreateCustomer,
  resolveCustomerId,
  searchCustomersCompletion,
  splitPersonName,
  type CustomerSearchHit,
} from "@/lib/offers";

export type OfferCustomerChoice = {
  id: string;
  label: string;
};

type OfferCustomerPickerProps = {
  value: OfferCustomerChoice | null;
  onChange: (next: OfferCustomerChoice | null) => void;
  onError: (message: string | null) => void;
};

export function OfferCustomerPicker({
  value,
  onChange,
  onError,
}: OfferCustomerPickerProps) {
  const t = useTranslations("offers");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [newName, setNewName] = useState("");

  useEffect(() => {
    if (!query.trim()) {
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
          onError(err instanceof Error ? err.message : t("customerSearchError"));
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [onError, query, router, t]);

  const selectHit = (hit: CustomerSearchHit) => {
    const id = resolveCustomerId(hit);
    if (!id) return;
    onChange({ id, label: formatCustomerLabel(hit) });
    setQuery("");
    setHits([]);
    setShowQuickCreate(false);
    onError(null);
  };

  const handleQuickCreate = async () => {
    const phone = newPhone.trim();
    if (!phone) {
      onError(t("phoneRequired"));
      return;
    }
    setCreating(true);
    onError(null);
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
      const names = splitPersonName(newName);
      const label =
        [created.firstName, created.lastName].filter(Boolean).join(" ") ||
        created.customerCompanyName ||
        created.phoneNumber ||
        created.id;
      onChange({
        id: created.id,
        label: label || names.first || phone,
      });
      setShowQuickCreate(false);
      setNewPhone("");
      setNewName("");
    } catch (err) {
      if (err instanceof PortalCrmError && err.status === 401) return;
      onError(err instanceof Error ? err.message : t("customerCreateError"));
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-extrabold tracking-[0.14em] text-[color:var(--brand-primary)]/50">
        {t("customerSection")}
      </h3>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-xl bg-[color:var(--brand-primary)]/5 px-3 py-2.5">
          <p className="min-w-0 truncate text-sm font-semibold text-[color:var(--brand-primary)]">
            {value.label}
          </p>
          <button
            type="button"
            className="text-xs font-semibold text-[color:var(--brand-primary)]/60 hover:text-[color:var(--brand-primary)]"
            onClick={() => onChange(null)}
          >
            {t("changeCustomer")}
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[color:var(--brand-primary)]/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("customerSearchPlaceholder")}
              className="h-11 w-full rounded-xl border border-black/10 bg-white pl-10 pr-3 text-sm text-[color:var(--brand-primary)] outline-none focus:border-[color:var(--brand-primary)]/40"
            />
            {searching && (
              <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-[color:var(--brand-primary)]/40" />
            )}
          </div>
          {hits.length > 0 && (
            <ul className="divide-y divide-black/5 overflow-hidden rounded-xl border border-black/5">
              {hits.map((hit) => {
                const id = resolveCustomerId(hit);
                if (!id) return null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => selectHit(hit)}
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-[color:var(--brand-primary)]/5"
                    >
                      <span className="font-semibold text-[color:var(--brand-primary)]">
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
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[color:var(--brand-primary)]"
            >
              <Plus className="size-3.5" /> {t("quickCreate")}
            </button>
          ) : (
            <div className="space-y-2 rounded-xl border border-black/5 p-3">
              <input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={t("quickCreateName")}
                className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none"
              />
              <input
                value={newPhone}
                onChange={(event) => setNewPhone(event.target.value)}
                placeholder={t("quickCreatePhone")}
                className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none"
              />
              <button
                type="button"
                disabled={creating}
                onClick={() => void handleQuickCreate()}
                className="h-10 w-full rounded-lg bg-[color:var(--brand-primary)] text-sm font-bold text-white disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="mx-auto size-4 animate-spin" />
                ) : (
                  t("quickCreateSubmit")
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
