"use client";

import { Check, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  isRawZoneAreaName,
  optionSwatchBackground,
  zoneAreaNumber,
  type MaterialZoneArea,
  type MaterialZoneOption,
} from "@/lib/material-zone";

type FabricPickerProps = {
  area: MaterialZoneArea;
  currentCode?: string;
  onClose: () => void;
  onPick: (option: MaterialZoneOption) => void;
};

export function FabricPicker({
  area,
  currentCode,
  onClose,
  onPick,
}: FabricPickerProps) {
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const options = area.options;
  const n = zoneAreaNumber(area.name, 1);
  const hint =
    area.label && !isRawZoneAreaName(area.label) ? area.label : null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 size-9 grid place-items-center rounded-full hover:bg-[color:var(--brand-primary)]/5 text-[color:var(--brand-primary)]/60"
        >
          <X className="size-5" />
        </button>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--brand-primary)]/45">
            {t("regionLabel", { n })}
            {hint ? ` · ${hint}` : ""}
          </p>
          <h3 className="text-2xl font-extrabold text-[color:var(--brand-primary)]">
            {t("suitableFabricsTitle")}
          </h3>
          <p className="text-sm text-[color:var(--brand-primary)]/55 mt-1">
            {t("suitableFabricsHint")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {options.map((option) => {
            const active = option.code === currentCode;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => onPick(option)}
                className={`group text-left rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  active
                    ? "border-[color:var(--brand-primary)] shadow-lg"
                    : "border-transparent bg-[color:var(--brand-primary)]/5"
                }`}
              >
                <div
                  className="relative h-36"
                  style={{ background: optionSwatchBackground(option) }}
                >
                  {active && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[color:var(--brand-primary)] text-white text-[11px] font-bold">
                      <Check className="size-3" /> {tCommon("selected")}
                    </span>
                  )}
                </div>
                <p className="px-4 py-3 font-semibold text-[color:var(--brand-primary)]">
                  {option.materialName || option.code}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
