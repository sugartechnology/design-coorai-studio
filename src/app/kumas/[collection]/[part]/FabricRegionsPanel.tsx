"use client";

import { ChevronRight, Loader2, ShoppingCart } from "lucide-react";
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
  onAddToQuote?: () => void;
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
  onAddToQuote,
  addToQuoteLabel,
}: FabricRegionsPanelProps) {
  const t = useTranslations("kumas");
  const progressSlots: Array<MaterialZoneArea | null> =
    areas.length > 0 ? areas : [null, null, null, null];

  return (
    <>
      <div className="mb-5 shrink-0 space-y-3">
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
                className="w-full rounded-xl bg-white object-contain aspect-square mb-3 border border-black/5"
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

        <div className="rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4">
          <div className="flex items-center gap-1.5 mb-2">
            {progressSlots.map((area, i) => {
              const name = area?.name ?? `placeholder-${i}`;
              const selected = area ? selectionByArea[area.name] : null;
              return (
                <div
                  key={name}
                  className="flex-1 h-2 rounded-full overflow-hidden bg-white"
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      background: selected
                        ? optionSwatchBackground(selected)
                        : `hsl(${i * 60}, 70%, 60%)`,
                      width: selected ? "100%" : "30%",
                    }}
                  />
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-[color:var(--istikbal-blue)]/55 leading-relaxed">
            {t("regionMatchHelp")}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 relative">
        {loading && areas.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[color:var(--istikbal-blue)]/50">
            <Loader2 className="size-4 animate-spin" /> {t("zonesLoading")}
          </div>
        )}
        {loading && areas.length > 0 && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-6 bg-white/50 pointer-events-none">
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
          <p className="text-sm text-[color:var(--istikbal-blue)]/50 py-6 text-center">
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
              className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[color:var(--istikbal-blue)]/5 hover:bg-[color:var(--istikbal-blue)]/10 transition-colors group disabled:opacity-60"
            >
              <span className="font-bold text-[color:var(--istikbal-blue)] text-left">
                {t("regionLabel", { n })}
                {hint ? (
                  <span className="block text-[11px] font-medium text-[color:var(--istikbal-blue)]/50">
                    {hint}
                  </span>
                ) : null}
              </span>
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-sm truncate ${
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
                <ChevronRight className="size-4 shrink-0 text-[color:var(--istikbal-blue)]/40 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 shrink-0 space-y-2">
        <button
          type="button"
          disabled={!allSelected}
          onClick={onAddToQuote}
          className="w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:bg-[color:var(--istikbal-blue)]/15 disabled:text-[color:var(--istikbal-blue)]/40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <ShoppingCart className="size-4" /> {addToQuoteLabel || t("addToCart")}
        </button>
        {!allSelected && areas.length > 0 && (
          <p className="text-center text-xs font-semibold text-[#f0a400] bg-[color:var(--istikbal-yellow)]/15 py-2 rounded-xl">
            {t("selectAllRegionsHint")}
          </p>
        )}
      </div>
    </>
  );
}
