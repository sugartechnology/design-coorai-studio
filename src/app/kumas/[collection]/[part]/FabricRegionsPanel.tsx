"use client";

import { ChevronRight, FileText, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isRawZoneAreaName,
  optionSwatchBackground,
  zoneAreaNumber,
  zoneColorForArea,
  type MaterialZoneArea,
  type MaterialZoneOption,
} from "@/lib/material-zone";

type FabricRegionsPanelProps = {
  areas: MaterialZoneArea[];
  selectionByArea: Record<string, MaterialZoneOption | null>;
  loading: boolean;
  error: string | null;
  allSelected: boolean;
  sku?: string | null;
  guideImage?: string | null;
  companyId?: number | string;
  onOpenPicker: (areaName: string) => void;
  onAddToCart?: () => void;
  onAddToQuote?: () => void;
  addToCartLabel?: string;
  addToQuoteLabel?: string;
};

export function FabricRegionsPanel({
  areas,
  selectionByArea,
  loading,
  error,
  allSelected,
  sku,
  guideImage,
  companyId = 42,
  onOpenPicker,
  onAddToCart,
  onAddToQuote,
  addToCartLabel,
  addToQuoteLabel,
}: FabricRegionsPanelProps) {
  const t = useTranslations("kumas");
  const tOffers = useTranslations("offers");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain pr-0.5">
        {sku && (
          <p className="text-xs font-semibold text-[color:var(--istikbal-blue)]/70">
            {t("skuLabel", { sku })}
          </p>
        )}

        {(guideImage || areas.length > 0) && (
          <div className="rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4">
            <p className="text-xs font-bold text-[color:var(--istikbal-blue)] mb-3">
              {t("fabricRegionsTitle")}
            </p>
            {guideImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={guideImage}
                alt={t("zoneGuideAlt")}
                className="mb-3 aspect-square w-full rounded-xl border border-black/5 bg-white object-contain"
              />
            )}
            {areas.length > 0 && (
              <ul className="space-y-1.5">
                {areas.map((area, i) => {
                  const n = zoneAreaNumber(area.name, i + 1);
                  const hint =
                    area.label && !isRawZoneAreaName(area.label)
                      ? area.label
                      : null;
                  return (
                    <li
                      key={area.name}
                      className="flex items-center gap-2 text-xs text-[color:var(--istikbal-blue)]/80"
                    >
                      <span
                        className="size-3.5 shrink-0 rounded-sm border border-black/10"
                        style={{
                          background: zoneColorForArea(area.name, companyId),
                        }}
                      />
                      <span className="font-semibold">
                        {t("regionLabel", { n })}
                      </span>
                      {hint ? (
                        <span className="truncate text-[color:var(--istikbal-blue)]/50">
                          · {hint}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <div className="relative space-y-2">
          {loading && areas.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-[color:var(--istikbal-blue)]/50">
              <Loader2 className="size-4 animate-spin" /> {t("zonesLoading")}
            </div>
          )}
          {loading && areas.length > 0 && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-white/50 pt-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--istikbal-blue)]/70 shadow-sm">
                <Loader2 className="size-3.5 animate-spin" /> {t("zonesLoading")}
              </span>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
          {!loading && !error && areas.length === 0 && (
            <p className="py-6 text-center text-sm text-[color:var(--istikbal-blue)]/50">
              {t("zonesEmpty")}
            </p>
          )}
          {areas.map((area, i) => {
            const selected = selectionByArea[area.name];
            const n = zoneAreaNumber(area.name, i + 1);
            const hint =
              area.label && !isRawZoneAreaName(area.label) ? area.label : null;
            return (
              <button
                key={area.name}
                type="button"
                onClick={() => onOpenPicker(area.name)}
                disabled={loading}
                className="group flex w-full items-center justify-between gap-3 rounded-xl bg-[color:var(--istikbal-blue)]/5 px-4 py-3 transition-colors hover:bg-[color:var(--istikbal-blue)]/10 disabled:opacity-60"
              >
                <span className="text-left font-bold text-[color:var(--istikbal-blue)]">
                  {t("regionLabel", { n })}
                  {hint ? (
                    <span className="block text-[11px] font-medium text-[color:var(--istikbal-blue)]/50">
                      {hint}
                    </span>
                  ) : null}
                </span>
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`truncate text-sm ${
                      selected
                        ? "text-[color:var(--istikbal-blue)]/80"
                        : "text-[color:var(--istikbal-blue)]/50"
                    }`}
                  >
                    {selected?.materialName ||
                      selected?.code ||
                      t("chooseFabric")}
                  </span>
                  <span
                    className="size-7 shrink-0 rounded-md border border-black/10 shadow-inner"
                    style={{ background: optionSwatchBackground(selected) }}
                  />
                  <ChevronRight className="size-4 shrink-0 text-[color:var(--istikbal-blue)]/40 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 shrink-0 space-y-2 border-t border-black/5 bg-white pt-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!allSelected}
            onClick={onAddToCart}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-[color:var(--istikbal-blue)] px-2 text-xs font-bold tracking-wide text-white shadow-md transition-all hover:bg-[color:var(--istikbal-navy)] disabled:cursor-not-allowed disabled:bg-[color:var(--istikbal-blue)]/15 disabled:text-[color:var(--istikbal-blue)]/40"
          >
            <ShoppingCart className="size-3.5 shrink-0" />
            <span className="truncate">{addToCartLabel || t("addToCart")}</span>
          </button>
          <button
            type="button"
            disabled={!allSelected}
            onClick={onAddToQuote}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl border border-[color:var(--istikbal-blue)]/20 bg-white px-2 text-xs font-bold tracking-wide text-[color:var(--istikbal-blue)] transition-all hover:bg-[color:var(--istikbal-blue)]/5 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FileText className="size-3.5 shrink-0" />
            <span className="truncate">
              {addToQuoteLabel || tOffers("addToQuote")}
            </span>
          </button>
        </div>
        {!allSelected && areas.length > 0 && (
          <p className="rounded-xl bg-[color:var(--istikbal-yellow)]/15 py-2 text-center text-xs font-semibold text-[#f0a400]">
            {t("selectAllRegionsHint")}
          </p>
        )}
      </div>
    </div>
  );
}
