"use client";

import { useEffect, useRef } from "react";
import { Check, ListFilter, X } from "lucide-react";
import type { SearchFilter, SearchFilterOption } from "@/lib/catalog";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facetFilters: SearchFilter[];
  hasActiveFacets: boolean;
  activeFacetCount: number;
  facetLabel: (field: string) => string;
  isOptionSelected: (field: string, option: SearchFilterOption) => boolean;
  onToggleOption: (field: string, option: SearchFilterOption) => void;
  onClear: () => void;
  clearLabel: string;
  filterAriaLabel: string;
};

function optionDepth(option: SearchFilterOption): number {
  if (typeof option.depth === "number" && option.depth >= 0) return option.depth;
  if (option.path?.length) return Math.max(0, option.path.length - 1);
  return 0;
}

export function ProductSearchFilterMenu({
  open,
  onOpenChange,
  facetFilters,
  hasActiveFacets,
  activeFacetCount,
  facetLabel,
  isOptionSelected,
  onToggleOption,
  onClear,
  clearLabel,
  filterAriaLabel,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        onOpenChange(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={filterAriaLabel}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={`relative size-10 rounded-xl border inline-flex items-center justify-center transition ${
          open || hasActiveFacets
            ? "bg-[color:var(--istikbal-blue)] text-white border-[color:var(--istikbal-blue)]"
            : "bg-black/5 text-[color:var(--istikbal-blue)] border-transparent hover:border-black/10"
        }`}
      >
        <ListFilter className="size-4" />
        {activeFacetCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-white text-[color:var(--istikbal-blue)] text-[9px] font-extrabold inline-flex items-center justify-center border border-[color:var(--istikbal-blue)]">
            {activeFacetCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(20rem,calc(100vw-2rem))] max-h-[min(28rem,70vh)] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-xl">
          <div className="px-3 py-2.5 border-b border-black/5 flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">
              {filterAriaLabel}
            </span>
            <div className="flex items-center gap-1">
              {hasActiveFacets && (
                <button
                  type="button"
                  onClick={onClear}
                  className="text-[10px] font-semibold text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)] px-2 py-1"
                >
                  {clearLabel}
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="size-7 rounded-lg hover:bg-black/5 inline-flex items-center justify-center text-[color:var(--istikbal-blue)]/50"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[min(24rem,60vh)] p-3 space-y-4">
            {facetFilters.length === 0 && (
              <p className="text-xs text-[color:var(--istikbal-blue)]/45 text-center py-6">—</p>
            )}
            {facetFilters.map((facet) => (
              <div key={facet.field}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50 mb-2">
                  {facetLabel(facet.field)}
                </div>
                {facet.field === "catalogs" ? (
                  <div className="grid grid-cols-2 gap-2">
                    {(facet.options ?? []).map((option) => {
                      const active = isOptionSelected(facet.field, option);
                      const label = option.label || option.value;
                      return (
                        <button
                          key={`${facet.field}:${option.value}`}
                          type="button"
                          onClick={() => onToggleOption(facet.field, option)}
                          className={`rounded-xl border p-2 text-left transition ${
                            active
                              ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue-soft)]"
                              : "border-black/8 hover:border-[color:var(--istikbal-blue)]/35"
                          }`}
                        >
                          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-stone-100 mb-1.5 relative">
                            {option.thumbnailUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={option.thumbnailUrl}
                                alt={label}
                                loading="lazy"
                                className="absolute inset-0 h-full w-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[color:var(--istikbal-blue)]/20 text-[10px]">
                                {label.slice(0, 1)}
                              </div>
                            )}
                            {active && (
                              <span className="absolute top-1 right-1 size-5 rounded-full bg-[color:var(--istikbal-blue)] text-white inline-flex items-center justify-center">
                                <Check className="size-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-semibold text-[color:var(--istikbal-blue)] leading-tight line-clamp-2">
                            {label}
                          </div>
                          {typeof option.count === "number" && (
                            <div className="mt-0.5 text-[10px] text-[color:var(--istikbal-blue)]/45">
                              {option.count}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {(facet.options ?? []).map((option) => {
                      const active = isOptionSelected(facet.field, option);
                      const label = option.label || option.value;
                      const depth = optionDepth(option);
                      return (
                        <button
                          key={`${facet.field}:${option.value}`}
                          type="button"
                          onClick={() => onToggleOption(facet.field, option)}
                          style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
                          className={`w-full pr-2 py-1.5 rounded-lg text-left text-[12px] font-medium transition flex items-center gap-2 ${
                            active
                              ? "bg-[color:var(--istikbal-blue)] text-white"
                              : "text-[color:var(--istikbal-blue)] hover:bg-black/[0.04]"
                          }`}
                        >
                          <span
                            className={`size-3.5 rounded border shrink-0 inline-flex items-center justify-center ${
                              active
                                ? "border-white/80 bg-white/15"
                                : "border-[color:var(--istikbal-blue)]/25"
                            }`}
                          >
                            {active && <Check className="size-2.5" />}
                          </span>
                          <span className="flex-1 min-w-0 truncate">{label}</span>
                          {typeof option.count === "number" && (
                            <span
                              className={`text-[10px] shrink-0 ${
                                active ? "text-white/70" : "text-[color:var(--istikbal-blue)]/40"
                              }`}
                            >
                              {option.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
