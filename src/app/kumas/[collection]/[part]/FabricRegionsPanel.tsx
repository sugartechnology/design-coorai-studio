"use client";

import { ChevronRight, Loader2, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  areaDisplayLabel,
  optionSwatchBackground,
  type MaterialZoneArea,
  type MaterialZoneOption,
} from "@/lib/material-zone";

type FabricRegionsPanelProps = {
  areas: MaterialZoneArea[];
  selectionByArea: Record<string, MaterialZoneOption | null>;
  loading: boolean;
  error: string | null;
  allSelected: boolean;
  onOpenPicker: (areaName: string) => void;
};

export function FabricRegionsPanel({
  areas,
  selectionByArea,
  loading,
  error,
  allSelected,
  onOpenPicker,
}: FabricRegionsPanelProps) {
  const t = useTranslations("kumas");
  const progressSlots: Array<MaterialZoneArea | null> =
    areas.length > 0 ? areas : [null, null, null, null];

  return (
    <>
      <div className="mb-5 shrink-0 rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4">
        <p className="text-xs font-bold text-[color:var(--istikbal-blue)] mb-2">
          {t("fabricRegionsTitle")}
        </p>
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

      <div className="min-h-0 flex-1 space-y-2">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-[color:var(--istikbal-blue)]/50">
            <Loader2 className="size-4 animate-spin" /> {t("zonesLoading")}
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
        {!loading &&
          areas.map((area) => {
            const selected = selectionByArea[area.name];
            return (
              <button
                key={area.name}
                type="button"
                onClick={() => onOpenPicker(area.name)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[color:var(--istikbal-blue)]/5 hover:bg-[color:var(--istikbal-blue)]/10 transition-colors group"
              >
                <span className="font-bold text-[color:var(--istikbal-blue)]">
                  {areaDisplayLabel(area)}
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
          disabled={!allSelected}
          className="w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:bg-[color:var(--istikbal-blue)]/15 disabled:text-[color:var(--istikbal-blue)]/40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <ShoppingCart className="size-4" /> {t("addToCart")}
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
