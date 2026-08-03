"use client";

import {
  Ruler,
  Eraser,
  Eye,
  ChevronRight,
  Plus,
  X,
  ListOrdered,
  Check,
  GripVertical,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";

// Brand modular products (köşe + kanepe takımları)
type CategoryId = "cornerSet" | "modularSofa" | "sofa";
type BadgeId = "new" | "popular";

type Product = {
  id: string;
  name: string;
  category: CategoryId;
  price: number;
  modules: string[]; // default build (module ids)
  badge?: BadgeId;
};

const PRODUCTS: Product[] = [
  { id: "p-klem-kose",   name: "Klem Modüler Köşe Takımı",   category: "cornerSet",    price: 64900, modules: ["m-uclu","m-kose","m-ikili"], badge: "new" },
  { id: "p-klem-uclu",   name: "Klem Modüler Üçlü Kanepe",    category: "modularSofa", price: 42900, modules: ["m-uclu","m-tekli"] },
  { id: "p-klem-l",      name: "Klem L Köşe Takımı",          category: "cornerSet",    price: 71500, modules: ["m-uclu","m-kose","m-uclu"], badge: "popular" },
  { id: "p-klem-u",      name: "Klem U Köşe Takımı",          category: "cornerSet",    price: 89500, modules: ["m-ikili","m-kose","m-uclu","m-kose","m-ikili"] },
  { id: "p-klem-love",   name: "Klem Loveseat Modüler",       category: "modularSofa", price: 38900, modules: ["m-love","m-puf"] },
  { id: "p-klem-large",  name: "Klem Large Modüler Kanepe",   category: "modularSofa", price: 47500, modules: ["m-large","m-large","m-puf"] },
  { id: "p-klem-tekli",  name: "Klem Tekli Berjer",           category: "sofa",         price: 16500, modules: ["m-tekli"] },
  { id: "p-klem-island", name: "Klem Ada Köşe Takımı",        category: "cornerSet",    price: 98500, modules: ["m-uclu","m-kose","m-uclu","m-puf"] },
];

// ---------- Data ----------
type WoodLabelKey = "woodLight" | "woodWhite" | "woodNatural" | "woodWalnut" | "woodBlack";
type Wood = { id: string; labelKey: WoodLabelKey; color: string };
type Fabric = { id: string; label: string; color: string };
type Module = { id: string; name: string; kind: "tekli" | "ikili" | "uclu" | "kose" | "loveseat" | "large" | "puf"; price: number; width: number };

const WOODS: Wood[] = [
  { id: "w1", labelKey: "woodLight",   color: "#c9a87a" },
  { id: "w2", labelKey: "woodWhite",   color: "#efe6d6" },
  { id: "w3", labelKey: "woodNatural", color: "#b87a3d" },
  { id: "w4", labelKey: "woodWalnut",  color: "#5b3a22" },
  { id: "w5", labelKey: "woodBlack",   color: "#1f1d1c" },
];

const FABRICS: Fabric[] = [
  { id: "f1", label: "Doğal Bukle - Bulut",    color: "#eee8de" },
  { id: "f2", label: "Antrasit",                color: "#6e6a64" },
  { id: "f3", label: "Çağla Yeşili",            color: "#c7d3b5" },
  { id: "f4", label: "Vizon",                   color: "#b9a991" },
  { id: "f5", label: "Açık Gri",                color: "#cfcfcf" },
  { id: "f6", label: "Toprak",                  color: "#a07a5b" },
  { id: "f7", label: "Lacivert",                color: "#2c3a55" },
];

const CUSHIONS = [
  { id: "c1", labelKey: "cushionSoft" as const },
  { id: "c2", labelKey: "cushionFirm" as const },
];

const ARMS = [
  { id: "a1", labelKey: "armThin" as const },
  { id: "a2", labelKey: "armThick" as const },
];

const MODULES: Module[] = [
  { id: "m-uclu",      name: "Klem Üçlü Modül",        kind: "uclu",     price: 28500, width: 240 },
  { id: "m-ikili",     name: "Klem İkili Modül",        kind: "ikili",    price: 21500, width: 180 },
  { id: "m-tekli",     name: "Klem Tekli Modül",        kind: "tekli",    price: 12500, width: 90 },
  { id: "m-large",     name: "Klem Tekli Large Modül",  kind: "large",    price: 14500, width: 110 },
  { id: "m-love",      name: "Klem Loveseat Modülü",    kind: "loveseat", price: 18900, width: 140 },
  { id: "m-kose",      name: "Klem Köşe Modülü",        kind: "kose",     price: 16500, width: 100 },
  { id: "m-puf",       name: "Klem Puf",                kind: "puf",      price: 6500,  width: 80  },
];

const CATEGORY_LABEL_KEYS: Record<CategoryId, "filterCornerSet" | "filterModularSofa" | "filterSofa"> = {
  cornerSet: "filterCornerSet",
  modularSofa: "filterModularSofa",
  sofa: "filterSofa",
};

const BADGE_LABEL_KEYS: Record<BadgeId, "badgeNew" | "badgePopular"> = {
  new: "badgeNew",
  popular: "badgePopular",
};

// ---------- Page ----------
function ModulerPage() {
  const t = useTranslations("moduler");
  const tCommon = useTranslations("common");
  const [wood, setWood] = useState(WOODS[0].id);
  const [fabric, setFabric] = useState(FABRICS[0].id);
  const [cushion, setCushion] = useState(CUSHIONS[0].id);
  const [arm, setArm] = useState(ARMS[0].id);
  const [build, setBuild] = useState<{ uid: string; moduleId: string }[]>([
    { uid: "b1", moduleId: "m-uclu" },
    { uid: "b2", moduleId: "m-kose" },
  ]);
  const [listOpen, setListOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [catFilter, setCatFilter] = useState<"all" | CategoryId>("all");
  const [dragOver, setDragOver] = useState(false);

  const openProduct = (p: Product) => {
    setSelectedProduct(p);
    setBuild(p.modules.map((mid, i) => ({ uid: `b${i}-${Math.random().toString(36).slice(2,6)}`, moduleId: mid })));
  };
  const backToList = () => setSelectedProduct(null);

  const filteredProducts = PRODUCTS.filter(p =>
    (catFilter === "all" || p.category === catFilter) &&
    (query === "" || p.name.toLowerCase().includes(query.toLowerCase()))
  );

  const onDropModule = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData("text/module");
    const m = MODULES.find(x => x.id === id);
    if (m) addModule(m);
  };

  const woodObj = WOODS.find(w => w.id === wood)!;
  const fabricObj = FABRICS.find(f => f.id === fabric)!;
  const cushionObj = CUSHIONS.find(c => c.id === cushion)!;
  const armObj = ARMS.find(a => a.id === arm)!;
  const woodLabel = t(woodObj.labelKey);
  const cushionLabel = t(cushionObj.labelKey);
  const armLabel = t(armObj.labelKey);

  const total = useMemo(
    () => build.reduce((sum, b) => sum + (MODULES.find(m => m.id === b.moduleId)?.price ?? 0), 0),
    [build]
  );

  const addModule = (m: Module) => setBuild(b => [...b, { uid: Math.random().toString(36).slice(2, 8), moduleId: m.id }]);
  const removeModule = (uid: string) => setBuild(b => b.filter(x => x.uid !== uid));
  const clearAll = () => setBuild([]);

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      <AppHeader
        title={
          selectedProduct
            ? t("headerTitleWithProduct", { name: selectedProduct.name })
            : t("headerTitle")
        }
        backHref="/"
        sticky
        actions={
          selectedProduct ? (
            <button
              type="button"
              onClick={backToList}
              className="text-xs font-semibold text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"
            >
              {t("backToList")}
            </button>
          ) : undefined
        }
      />

      {!selectedProduct ? (
        <CatalogView
          products={filteredProducts}
          fabric={fabricObj}
          wood={woodObj}
          query={query}
          setQuery={setQuery}
          catFilter={catFilter}
          setCatFilter={setCatFilter}
          onOpen={openProduct}
        />
      ) : (
      <main className="px-4 lg:px-8 py-6 grid grid-cols-12 gap-4">
        {/* Preview */}
        <section className="col-span-12 lg:col-span-8">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div
              className={`aspect-[16/10] bg-gradient-to-br from-white to-stone-100 relative transition ${dragOver ? "ring-4 ring-[color:var(--istikbal-blue)]/40 ring-inset" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDropModule}
            >
              <SofaPreview build={build} fabric={fabricObj} wood={woodObj} arm={armObj.id} />
              {dragOver && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="px-4 py-2 rounded-full bg-[color:var(--istikbal-blue)] text-white text-sm font-semibold shadow-lg">{t("dropToAdd")}</div>
                </div>
              )}

              {/* Bottom toolbar */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <ToolBtn icon={<Ruler className="size-4" />} label={t("toolDimensions")} />
                <ToolBtn icon={<Eraser className="size-4" />} label={t("toolClearArea")} onClick={clearAll} />
                <ToolBtn icon={<Eye className="size-4" />} label={t("toolTopView")} />
              </div>

              {/* Price + list */}
              <div className="absolute bottom-4 right-4 flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-[color:var(--istikbal-blue)]/50 font-medium">{tCommon("total")}</div>
                  <div className="text-2xl font-extrabold text-[color:var(--istikbal-blue)]">
                    {total.toLocaleString("tr-TR")}<span className="text-sm font-semibold">,00 {tCommon("currencyTl")}</span>
                  </div>
                </div>
                <button
                  onClick={() => setListOpen(true)}
                  className="h-12 px-5 rounded-full bg-[color:var(--istikbal-blue)] text-white font-semibold hover:opacity-90 flex items-center gap-2"
                >
                  <ListOrdered className="size-4" /> {t("productList")} <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Selected modules row */}
          <div className="mt-4 bg-white rounded-2xl shadow-sm p-3 flex items-center gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider px-2 shrink-0">{t("selectedModules")}</span>
            {build.length === 0 && <span className="text-sm text-[color:var(--istikbal-blue)]/40 px-2">{t("noModulesYet")}</span>}
            {build.map(b => {
              const m = MODULES.find(x => x.id === b.moduleId)!;
              return (
                <div key={b.uid} className="shrink-0 flex items-center gap-2 rounded-xl bg-black/5 pl-3 pr-1 py-1">
                  <span className="text-xs font-semibold text-[color:var(--istikbal-blue)]">{m.name}</span>
                  <button onClick={() => removeModule(b.uid)} className="size-6 rounded-full bg-white text-rose-500 hover:bg-rose-50 flex items-center justify-center">
                    <X className="size-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right options panel */}
        <aside className="col-span-12 lg:col-span-4 space-y-3">
          {/* Ahşap */}
          <OptionBlock title={t("woodOption")} value={t("woodValuePrefix", { label: woodLabel })}>
            <div className="flex items-center gap-2 flex-wrap">
              {WOODS.map(w => (
                <button key={w.id} onClick={() => setWood(w.id)} className={`size-11 rounded-full border-2 transition flex items-center justify-center ${wood === w.id ? "border-[color:var(--istikbal-blue)]" : "border-transparent hover:border-black/10"}`}>
                  <span className="size-9 rounded-full block" style={{ background: w.color, boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.15)" }} />
                </button>
              ))}
            </div>
          </OptionBlock>

          {/* Kumaş */}
          <OptionBlock title={t("fabricOption")} value={`/ ${fabricObj.label}`}>
            <div className="flex items-center gap-2 flex-wrap">
              {FABRICS.map(f => (
                <button key={f.id} onClick={() => setFabric(f.id)} className={`size-11 rounded-full border-2 transition ${fabric === f.id ? "border-[color:var(--istikbal-blue)]" : "border-transparent hover:border-black/10"}`}>
                  <span className="size-9 rounded-full block" style={{ background: f.color, boxShadow: "inset 0 -3px 6px rgba(0,0,0,0.18)" }} />
                </button>
              ))}
            </div>
          </OptionBlock>

          {/* Sırt Minderi */}
          <OptionBlock title={t("backCushion")} value={cushionLabel}>
            <div className="flex items-center gap-2">
              {CUSHIONS.map(c => (
                <button key={c.id} onClick={() => setCushion(c.id)} className={`flex items-center gap-2 h-11 px-4 rounded-xl border-2 transition ${cushion === c.id ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue)]/5" : "border-black/5 hover:border-black/20"}`}>
                  <CushionIcon variant={c.id === "c1" ? "soft" : "firm"} active={cushion === c.id} />
                  <span className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{t(c.labelKey)}</span>
                </button>
              ))}
            </div>
          </OptionBlock>

          {/* Kol */}
          <OptionBlock title={t("armOption")} value={armLabel}>
            <div className="flex items-center gap-2">
              {ARMS.map(a => (
                <button key={a.id} onClick={() => setArm(a.id)} className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition w-24 ${arm === a.id ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue)]/5" : "border-black/5 hover:border-black/20"}`}>
                  <ArmIcon variant={a.id === "a1" ? "thin" : "thick"} active={arm === a.id} />
                  <span className="text-[11px] font-semibold text-[color:var(--istikbal-blue)]">{t(a.labelKey)}</span>
                </button>
              ))}
            </div>
          </OptionBlock>

          {/* Modules */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-3 flex items-center gap-1.5"><GripVertical className="size-3" /> {t("modulesDragHint")}</h3>
            <div className="grid grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
              {MODULES.map(m => (
                <button
                  key={m.id}
                  onClick={() => addModule(m)}
                  draggable
                  onDragStart={(e) => { e.dataTransfer.setData("text/module", m.id); e.dataTransfer.effectAllowed = "copy"; }}
                  className="group rounded-xl border border-black/5 hover:border-[color:var(--istikbal-blue)]/40 hover:shadow-md transition p-2 text-left cursor-grab active:cursor-grabbing"
                >
                  <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-stone-50 to-stone-100 flex items-center justify-center mb-1.5">
                    <ModuleSilhouette kind={m.kind} color={fabricObj.color} woodColor={woodObj.color} />
                  </div>
                  <div className="text-[11px] font-semibold text-[color:var(--istikbal-blue)] leading-tight line-clamp-2">{m.name}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[color:var(--istikbal-blue)]/60">{m.price.toLocaleString("tr-TR")} {tCommon("currencyTl")}</span>
                    <Plus className="size-3.5 text-[color:var(--istikbal-blue)]/40 group-hover:text-[color:var(--istikbal-blue)]" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>
      )}

      {/* Product list modal */}
      {listOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setListOpen(false)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[color:var(--istikbal-blue)]">{t("productList")}</h3>
              <button onClick={() => setListOpen(false)} className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[color:var(--istikbal-blue)]"><X className="size-4" /></button>
            </div>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {build.length === 0 && <p className="text-sm text-[color:var(--istikbal-blue)]/50">{t("listEmpty")}</p>}
              {build.map(b => {
                const m = MODULES.find(x => x.id === b.moduleId)!;
                return (
                  <div key={b.uid} className="flex items-center justify-between p-3 rounded-xl bg-stone-50">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{m.name}</div>
                      <div className="text-[11px] text-[color:var(--istikbal-blue)]/50">{t("listLineMeta", { fabric: fabricObj.label, wood: woodLabel })}</div>
                    </div>
                    <div className="text-sm font-bold text-[color:var(--istikbal-blue)]">{m.price.toLocaleString("tr-TR")} {tCommon("currencyTl")}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
              <span className="text-sm font-semibold text-[color:var(--istikbal-blue)]/70">{tCommon("total")}</span>
              <span className="text-2xl font-extrabold text-[color:var(--istikbal-blue)]">{total.toLocaleString("tr-TR")},00 {tCommon("currencyTl")}</span>
            </div>
            <button className="mt-4 w-full h-12 rounded-xl bg-[color:var(--istikbal-blue)] text-white font-semibold hover:opacity-90 flex items-center justify-center gap-2">
              <Check className="size-4" /> {t("confirmSave")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function OptionBlock({ title, value, children }: { title: string; value: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-baseline gap-2 mb-3">
        <h3 className="text-sm font-bold text-[color:var(--istikbal-blue)]">{title}</h3>
        <span className="text-xs text-[color:var(--istikbal-blue)]/50">- {value}</span>
      </div>
      {children}
    </div>
  );
}

function ToolBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="h-10 px-3 rounded-xl bg-white/90 backdrop-blur border border-black/5 text-xs font-semibold text-[color:var(--istikbal-blue)] hover:bg-white flex items-center gap-1.5 shadow-sm">
      {icon} {label}
    </button>
  );
}

function CushionIcon({ variant, active }: { variant: "soft" | "firm"; active: boolean }) {
  const c = active ? "var(--istikbal-blue)" : "#9ca3af";
  return (
    <svg viewBox="0 0 32 32" className="w-7 h-7">
      {variant === "soft" ? (
        <path d="M6 22 C6 14, 10 8, 16 8 C22 8, 26 14, 26 22 Z" fill="none" stroke={c} strokeWidth="2" />
      ) : (
        <rect x="6" y="10" width="20" height="14" rx="3" fill="none" stroke={c} strokeWidth="2" />
      )}
    </svg>
  );
}

function ArmIcon({ variant, active }: { variant: "thin" | "thick"; active: boolean }) {
  const c = active ? "var(--istikbal-blue)" : "#9ca3af";
  const w = variant === "thin" ? 4 : 9;
  return (
    <svg viewBox="0 0 40 30" className="w-10 h-7">
      <rect x="2" y="8" width={w} height="18" rx="2" fill={c} opacity="0.85" />
      <rect x={2 + w} y="14" width={36 - w} height="12" rx="2" fill="none" stroke={c} strokeWidth="2" />
    </svg>
  );
}

// Simple silhouette by module kind
function ModuleSilhouette({ kind, color, woodColor }: { kind: Module["kind"]; color: string; woodColor: string }) {
  // base 80x60
  const seats = kind === "uclu" ? 3 : kind === "ikili" || kind === "loveseat" ? 2 : 1;
  const isLarge = kind === "large";
  const isKose = kind === "kose";
  const isPuf = kind === "puf";
  const w = isPuf ? 50 : isLarge ? 70 : 20 + seats * 18;
  return (
    <svg viewBox="0 0 80 60" className="w-full h-full">
      {/* body */}
      {isPuf ? (
        <rect x={(80 - w) / 2} y="30" width={w} height="18" rx="4" fill={color} stroke="#3d3027" strokeOpacity="0.2" />
      ) : (
        <>
          <rect x={(80 - w) / 2} y="18" width={w} height="30" rx="5" fill={color} stroke="#3d3027" strokeOpacity="0.2" />
          {/* backrest */}
          {!isKose && <rect x={(80 - w) / 2 + 2} y="14" width={w - 4} height="14" rx="3" fill={shade(color, -8)} />}
          {isKose && <rect x={(80 - w) / 2} y="14" width="14" height="34" rx="3" fill={shade(color, -8)} />}
          {/* seat cushions */}
          {Array.from({ length: seats }).map((_, i) => (
            <rect key={i} x={(80 - w) / 2 + 3 + i * ((w - 6) / seats)} y="32" width={(w - 6) / seats - 2} height="14" rx="2" fill={shade(color, 8)} />
          ))}
        </>
      )}
      {/* legs */}
      {!isPuf && [(80 - w) / 2 + 4, (80 - w) / 2 + w - 8].map((x, i) => (
        <rect key={i} x={x} y="48" width="4" height="8" rx="1" fill={woodColor} />
      ))}
    </svg>
  );
}

// Large sofa preview
function SofaPreview({ build, fabric, wood, arm }: { build: { uid: string; moduleId: string }[]; fabric: Fabric; wood: Wood; arm: string }) {
  const t = useTranslations("moduler");
  const totalW = build.reduce((s, b) => s + (MODULES.find(m => m.id === b.moduleId)?.width ?? 0), 0);
  if (totalW === 0) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-center px-8">
        <div>
          <div className="text-5xl mb-2">🛋️</div>
          <p className="text-[color:var(--istikbal-blue)]/50 text-sm font-medium whitespace-pre-line">{t("emptyPreviewHint")}</p>
        </div>
      </div>
    );
  }
  const VBW = Math.max(800, totalW * 4);
  const VBH = 380;
  const armW = arm === "a2" ? 36 : 18;
  let cursor = armW + 20;
  const baseY = 180;
  const H = 140;
  const armH = 170;

  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="sofaTop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(fabric.color, 15)} />
          <stop offset="1" stopColor={fabric.color} />
        </linearGradient>
        <linearGradient id="sofaShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fabric.color} />
          <stop offset="1" stopColor={shade(fabric.color, -25)} />
        </linearGradient>
      </defs>

      {/* Floor shadow */}
      <ellipse cx={VBW / 2} cy={VBH - 18} rx={totalW * 2 + 60} ry="14" fill="rgba(0,0,0,0.08)" />

      {/* Left arm */}
      <rect x={20} y={baseY - armH} width={armW} height={armH + H - 20} rx="14" fill="url(#sofaShadow)" />
      <rect x={20 + 4} y={baseY - armH + 4} width={armW - 8} height={armH - 10} rx="10" fill="url(#sofaTop)" />

      {/* Modules */}
      {build.map((b) => {
        const m = MODULES.find(x => x.id === b.moduleId)!;
        const segW = m.width * 4;
        const seats = m.kind === "uclu" ? 3 : m.kind === "ikili" || m.kind === "loveseat" ? 2 : 1;
        const isPuf = m.kind === "puf";
        const isKose = m.kind === "kose";
        const x = cursor;
        cursor += segW;
        return (
          <g key={b.uid}>
            {/* base */}
            <rect x={x} y={baseY} width={segW} height={H} rx="12" fill="url(#sofaShadow)" />
            {/* backrest */}
            {!isPuf && (
              <rect x={x + 4} y={baseY - 110} width={segW - 8} height="120" rx="10" fill="url(#sofaTop)" />
            )}
            {/* seat cushions */}
            {!isPuf && Array.from({ length: seats }).map((_, i) => {
              const cw = (segW - 16) / seats - 4;
              return (
                <rect key={i} x={x + 8 + i * ((segW - 16) / seats) + 2} y={baseY + 20} width={cw} height={H - 40} rx="10" fill={shade(fabric.color, 18)} stroke={shade(fabric.color, -10)} strokeOpacity="0.3" />
              );
            })}
            {/* back cushions */}
            {!isPuf && Array.from({ length: seats }).map((_, i) => {
              const cw = (segW - 16) / seats - 6;
              return (
                <rect key={`bc${i}`} x={x + 8 + i * ((segW - 16) / seats) + 3} y={baseY - 95} width={cw} height="100" rx="14" fill={shade(fabric.color, 10)} stroke={shade(fabric.color, -10)} strokeOpacity="0.25" />
              );
            })}
            {isPuf && <rect x={x + 6} y={baseY - 10} width={segW - 12} height={H - 10} rx="14" fill="url(#sofaTop)" />}
            {isKose && <rect x={x} y={baseY - 110} width="40" height="120" rx="10" fill={shade(fabric.color, -5)} />}
            {/* legs */}
            <rect x={x + 14} y={baseY + H - 4} width="8" height="22" rx="2" fill={wood.color} />
            <rect x={x + segW - 22} y={baseY + H - 4} width="8" height="22" rx="2" fill={wood.color} />
          </g>
        );
      })}

      {/* Right arm */}
      <rect x={cursor} y={baseY - armH} width={armW} height={armH + H - 20} rx="14" fill="url(#sofaShadow)" />
      <rect x={cursor + 4} y={baseY - armH + 4} width={armW - 8} height={armH - 10} rx="10" fill="url(#sofaTop)" />
    </svg>
  );
}

function shade(hex: string, amt: number): string {
  const h = hex.replace("#", "");
  const r = Math.max(0, Math.min(255, parseInt(h.slice(0, 2), 16) + amt));
  const g = Math.max(0, Math.min(255, parseInt(h.slice(2, 4), 16) + amt));
  const b = Math.max(0, Math.min(255, parseInt(h.slice(4, 6), 16) + amt));
  return `#${[r, g, b].map(x => x.toString(16).padStart(2, "0")).join("")}`;
}

// ---------- Catalog (product listing) ----------
function CatalogView({
  products, fabric, wood, query, setQuery, catFilter, setCatFilter, onOpen,
}: {
  products: Product[];
  fabric: Fabric;
  wood: Wood;
  query: string;
  setQuery: (s: string) => void;
  catFilter: "all" | CategoryId;
  setCatFilter: (s: "all" | CategoryId) => void;
  onOpen: (p: Product) => void;
}) {
  const t = useTranslations("moduler");
  const tCommon = useTranslations("common");
  const cats: ("all" | CategoryId)[] = ["all", "cornerSet", "modularSofa", "sofa"];
  const catLabel = (c: "all" | CategoryId) =>
    c === "all" ? t("filterAll") : t(CATEGORY_LABEL_KEYS[c]);

  return (
    <main className="px-4 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-[color:var(--istikbal-blue)]">{t("catalogTitle")}</h1>
          <p className="text-sm text-[color:var(--istikbal-blue)]/60 mt-1">{t("catalogSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-black/5 text-sm text-[color:var(--istikbal-blue)] outline-none focus:border-[color:var(--istikbal-blue)]/30"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto">
        {cats.map(c => (
          <button
            key={c}
            onClick={() => setCatFilter(c)}
            className={`h-9 px-4 rounded-full text-xs font-semibold whitespace-nowrap transition border ${catFilter === c ? "bg-[color:var(--istikbal-blue)] text-white border-[color:var(--istikbal-blue)]" : "bg-white text-[color:var(--istikbal-blue)]/70 border-black/5 hover:border-black/20"}`}
          >
            {catLabel(c)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map(p => (
          <button
            key={p.id}
            onClick={() => onOpen(p)}
            className="group bg-white rounded-2xl shadow-sm overflow-hidden text-left hover:shadow-lg transition border border-transparent hover:border-[color:var(--istikbal-blue)]/20"
          >
            <div className="aspect-[4/3] bg-gradient-to-br from-stone-50 to-stone-100 relative flex items-center justify-center">
              <ProductThumb modules={p.modules} fabric={fabric} wood={wood} />
              {p.badge && (
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-[color:var(--istikbal-yellow)] text-[10px] font-bold text-[color:var(--istikbal-blue)]">{t(BADGE_LABEL_KEYS[p.badge])}</span>
              )}
            </div>
            <div className="p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50">{t(CATEGORY_LABEL_KEYS[p.category])}</div>
              <div className="text-sm font-bold text-[color:var(--istikbal-blue)] mt-0.5 line-clamp-1">{p.name}</div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-extrabold text-[color:var(--istikbal-blue)]">{p.price.toLocaleString("tr-TR")} {tCommon("currencyTl")}</span>
                <span className="text-[11px] font-semibold text-[color:var(--istikbal-blue)]/60 group-hover:text-[color:var(--istikbal-blue)] flex items-center gap-0.5">{t("customize")} <ChevronRight className="size-3.5" /></span>
              </div>
            </div>
          </button>
        ))}
        {products.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl p-10 text-center text-sm text-[color:var(--istikbal-blue)]/50">{tCommon("noResults")}</div>
        )}
      </div>
    </main>
  );
}

function ProductThumb({ modules, fabric, wood }: { modules: string[]; fabric: Fabric; wood: Wood }) {
  const items = modules.map(id => MODULES.find(m => m.id === id)!).filter(Boolean);
  const totalW = items.reduce((s, m) => s + m.width, 0);
  const VBW = Math.max(220, totalW * 1.4);
  const VBH = 120;
  let cursor = 10;
  return (
    <svg viewBox={`0 0 ${VBW} ${VBH}`} className="w-[85%] h-[85%]" preserveAspectRatio="xMidYMid meet">
      <ellipse cx={VBW / 2} cy={VBH - 8} rx={totalW * 0.7 + 20} ry="6" fill="rgba(0,0,0,0.08)" />
      {items.map((m, i) => {
        const w = m.width * 1.4;
        const isPuf = m.kind === "puf";
        const isKose = m.kind === "kose";
        const x = cursor;
        cursor += w;
        return (
          <g key={i}>
            <rect x={x} y={60} width={w} height={36} rx="6" fill={shade(fabric.color, -10)} />
            {!isPuf && <rect x={x + 2} y={30} width={w - 4} height={38} rx="5" fill={fabric.color} />}
            {isPuf && <rect x={x + 3} y={56} width={w - 6} height={36} rx="7" fill={fabric.color} />}
            {isKose && <rect x={x} y={30} width="14" height={38} rx="4" fill={shade(fabric.color, -15)} />}
            <rect x={x + 4} y={94} width="4" height="8" rx="1" fill={wood.color} />
            <rect x={x + w - 8} y={94} width="4" height="8" rx="1" fill={wood.color} />
          </g>
        );
      })}
    </svg>
  );
}


export default ModulerPage;
