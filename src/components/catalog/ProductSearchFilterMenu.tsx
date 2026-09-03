"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ListFilter, X } from "lucide-react";
import type { SearchFilter, SearchFilterOption } from "@/lib/catalog";

type FilterListProps = {
  facetFilters: SearchFilter[];
  facetLabel: (field: string) => string;
  isOptionSelected: (field: string, option: SearchFilterOption) => boolean;
  onToggleOption: (field: string, option: SearchFilterOption) => void;
  className?: string;
};

type Props = FilterListProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasActiveFacets: boolean;
  activeFacetCount: number;
  onClear: () => void;
  clearLabel: string;
  filterAriaLabel: string;
};

function optionDepth(option: SearchFilterOption): number {
  if (typeof option.depth === "number" && option.depth >= 0) return option.depth;
  if (option.path?.length) return Math.max(0, option.path.length - 1);
  return 0;
}

function selectedCountInFacet(
  facet: SearchFilter,
  isOptionSelected: (field: string, option: SearchFilterOption) => boolean,
) {
  return (facet.options ?? []).filter((option) => isOptionSelected(facet.field, option)).length;
}

export function ProductSearchFilterList({
  facetFilters,
  facetLabel,
  isOptionSelected,
  onToggleOption,
  className,
}: FilterListProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const sectionKeys = useMemo(
    () => facetFilters.map((facet) => facet.field).filter(Boolean),
    [facetFilters],
  );

  useEffect(() => {
    setExpandedSections((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const key of sectionKeys) {
        if (next[key] === undefined) {
          next[key] = key === "typeCategories" || key === "categories" || key === "catalogs";
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sectionKeys]);

  const toggleSection = (field: string) => {
    setExpandedSections((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleNode = (value: string) => {
    setExpandedNodes((prev) => ({ ...prev, [value]: !prev[value] }));
  };

  return (
    <div className={className ?? "space-y-2"}>
      {facetFilters.length === 0 && (
        <p className="text-xs text-[color:var(--brand-primary)]/45 text-center py-8">—</p>
      )}
      {facetFilters.map((facet) => {
        const sectionOpen = expandedSections[facet.field] ?? true;
        const count = selectedCountInFacet(facet, isOptionSelected);
        return (
          <section
            key={facet.field}
            className="rounded-xl border border-black/6 bg-white overflow-hidden"
          >
            <button
              type="button"
              onClick={() => toggleSection(facet.field)}
              className="w-full px-3 h-10 flex items-center justify-between gap-2 text-left hover:bg-black/[0.02] transition"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--brand-primary)]">
                  {facetLabel(facet.field)}
                </span>
                {count > 0 && (
                  <span className="inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-[color:var(--brand-primary)] text-white text-[10px] font-extrabold">
                    {count}
                  </span>
                )}
              </span>
              <ChevronDown
                className={`size-4 text-[color:var(--brand-primary)]/40 transition-transform duration-200 ${
                  sectionOpen ? "rotate-0" : "-rotate-90"
                }`}
              />
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                sectionOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div className="px-2.5 pb-2.5 pt-0.5">
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
                                ? "border-[color:var(--brand-primary)] bg-[color:var(--brand-soft)] shadow-sm"
                                : "border-black/8 hover:border-[color:var(--brand-primary)]/30"
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
                                <div className="absolute inset-0 flex items-center justify-center text-[color:var(--brand-primary)]/20 text-[10px] font-bold">
                                  {label.slice(0, 1)}
                                </div>
                              )}
                              {active && (
                                <span className="absolute top-1 right-1 size-5 rounded-full bg-[color:var(--brand-primary)] text-white inline-flex items-center justify-center">
                                  <Check className="size-3" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-semibold text-[color:var(--brand-primary)] leading-tight line-clamp-2">
                              {label}
                            </div>
                            {typeof option.count === "number" && (
                              <div className="mt-0.5 text-[10px] text-[color:var(--brand-primary)]/45">
                                {option.count}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : facet.field === "typeCategories" || facet.field === "categories" ? (
                    <TypeCategoryTree
                      options={facet.options ?? []}
                      isOptionSelected={(option) => isOptionSelected(facet.field, option)}
                      onToggleOption={(option) => onToggleOption(facet.field, option)}
                      expandedNodes={expandedNodes}
                      onToggleNode={toggleNode}
                    />
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
                                ? "bg-[color:var(--brand-primary)] text-white"
                                : "text-[color:var(--brand-primary)] hover:bg-black/[0.04]"
                            }`}
                          >
                            <span
                              className={`size-3.5 rounded border shrink-0 inline-flex items-center justify-center ${
                                active
                                  ? "border-white/80 bg-white/15"
                                  : "border-[color:var(--brand-primary)]/25"
                              }`}
                            >
                              {active && <Check className="size-2.5" />}
                            </span>
                            <span className="flex-1 min-w-0 truncate">{label}</span>
                            {typeof option.count === "number" && (
                              <span
                                className={`text-[10px] shrink-0 ${
                                  active ? "text-white/70" : "text-[color:var(--brand-primary)]/40"
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
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
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
            ? "bg-[color:var(--brand-primary)] text-white border-[color:var(--brand-primary)] shadow-sm"
            : "bg-black/5 text-[color:var(--brand-primary)] border-transparent hover:border-black/10"
        }`}
      >
        <ListFilter className="size-4" />
        {activeFacetCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-white text-[color:var(--brand-primary)] text-[9px] font-extrabold inline-flex items-center justify-center border border-[color:var(--brand-primary)]">
            {activeFacetCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[min(22rem,calc(100vw-2rem))] max-h-[min(32rem,75vh)] overflow-hidden rounded-2xl border border-black/8 bg-white/95 backdrop-blur-md shadow-[0_20px_50px_-24px_rgba(15,23,42,0.45)]">
          <div className="px-3.5 py-3 border-b border-black/5 flex items-center justify-between gap-2 bg-gradient-to-b from-black/[0.02] to-transparent">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--brand-primary)]/55">
              {filterAriaLabel}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!hasActiveFacets}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!hasActiveFacets) return;
                  onClear();
                }}
                className="h-7 px-2.5 rounded-lg text-[10px] font-semibold transition disabled:opacity-35 disabled:pointer-events-none text-[color:var(--brand-primary)]/70 hover:text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5"
              >
                {clearLabel}
              </button>
              <button
                type="button"
                aria-label="Close"
                onClick={() => onOpenChange(false)}
                className="size-7 rounded-lg hover:bg-black/5 inline-flex items-center justify-center text-[color:var(--brand-primary)]/45"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[min(28rem,65vh)] p-2.5">
            <ProductSearchFilterList
              facetFilters={facetFilters}
              facetLabel={facetLabel}
              isOptionSelected={isOptionSelected}
              onToggleOption={onToggleOption}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TypeCategoryTree({
  options,
  isOptionSelected,
  onToggleOption,
  expandedNodes,
  onToggleNode,
}: {
  options: SearchFilterOption[];
  isOptionSelected: (option: SearchFilterOption) => boolean;
  onToggleOption: (option: SearchFilterOption) => void;
  expandedNodes: Record<string, boolean>;
  onToggleNode: (value: string) => void;
}) {
  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, SearchFilterOption[]>();
    for (const option of options) {
      const parent = option.parentValue?.trim() || null;
      const list = map.get(parent) ?? [];
      list.push(option);
      map.set(parent, list);
    }
    return map;
  }, [options]);

  const roots = childrenByParent.get(null) ?? options.filter((option) => !option.parentValue);

  const renderNode = (option: SearchFilterOption) => {
    const children = childrenByParent.get(option.value) ?? [];
    const hasChildren = children.length > 0;
    const active = isOptionSelected(option);
    const label = option.label || option.value;
    const expanded =
      expandedNodes[option.value] !== undefined
        ? expandedNodes[option.value]
        : hasChildren && children.some((child) => isOptionSelected(child));

    return (
      <div key={option.value}>
        <div className="flex items-center gap-0.5">
          {hasChildren ? (
            <button
              type="button"
              aria-label={expanded ? "Collapse" : "Expand"}
              onClick={() => onToggleNode(option.value)}
              className="size-7 rounded-md inline-flex items-center justify-center text-[color:var(--brand-primary)]/40 hover:bg-black/[0.04] shrink-0"
            >
              <ChevronDown
                className={`size-3.5 transition-transform duration-200 ${expanded ? "rotate-0" : "-rotate-90"}`}
              />
            </button>
          ) : (
            <span className="size-7 shrink-0" />
          )}
          <button
            type="button"
            onClick={() => onToggleOption(option)}
            className={`flex-1 min-w-0 pr-2 py-1.5 rounded-lg text-left text-[12px] font-medium transition flex items-center gap-2 ${
              active
                ? "bg-[color:var(--brand-primary)] text-white"
                : "text-[color:var(--brand-primary)] hover:bg-black/[0.04]"
            }`}
          >
            <span
              className={`size-3.5 rounded border shrink-0 inline-flex items-center justify-center ${
                active ? "border-white/80 bg-white/15" : "border-[color:var(--brand-primary)]/25"
              }`}
            >
              {active && <Check className="size-2.5" />}
            </span>
            <span className="flex-1 min-w-0 truncate">{label}</span>
            {typeof option.count === "number" && (
              <span className={`text-[10px] shrink-0 ${active ? "text-white/70" : "text-[color:var(--brand-primary)]/40"}`}>
                {option.count}
              </span>
            )}
          </button>
        </div>
        {hasChildren && (
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-out ${
              expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="min-h-0 overflow-hidden pl-3 border-l border-black/5 ml-3.5">
              <div className="py-0.5 space-y-0.5">{children.map(renderNode)}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <div className="space-y-0.5">{roots.map(renderNode)}</div>;
}
