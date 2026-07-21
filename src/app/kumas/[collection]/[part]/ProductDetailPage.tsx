"use client";

import { useEffect, useState } from "react";
import { notFound, useParams } from "next/navigation";
import { Box, ShoppingCart, ChevronRight, X, AlertCircle, Check, RotateCw } from "lucide-react";
import { parts } from "@/lib/kumas-data";
import { getCollection } from "@/lib/catalog";

type Fabric = {
  id: string;
  name: string;
  // CSS background: a layered conic+radial to mimic woven texture
  bg: string;
  warning?: boolean;
};

const fabrics: Fabric[] = [
  { id: "lorea-gri",       name: "Lorea Gri Düz",      bg: "linear-gradient(135deg,#c9c2bd,#b7afa9)" , warning: true },
  { id: "marven-vizon",    name: "Marven Vizon Serpme",bg: "linear-gradient(135deg,#f1cdb6,#e3b598)", warning: true },
  { id: "lorea-antrasit",  name: "Lorea Antrasit Düz", bg: "linear-gradient(135deg,#4b4f54,#363a3f)", warning: true },
  { id: "sandra-haki",     name: "Sandra Haki Düz",    bg: "linear-gradient(135deg,#33523f,#243a2d)", warning: true },
  { id: "cross-krem",      name: "Cross Krem Düz",     bg: "linear-gradient(135deg,#dcd9b8,#c8c69b)", warning: true },
  { id: "lorea-vizon",     name: "Lorea Vizon Düz",    bg: "linear-gradient(135deg,#e3c2a0,#caa17a)", warning: true },
  { id: "marven-antrasit", name: "Marven Antrasit",    bg: "linear-gradient(135deg,#3f4348,#2a2d31)" },
  { id: "linen-krem",      name: "Linen Krem Duz",     bg: "linear-gradient(135deg,#eee6cf,#d9cfb1)" },
];

const DETAIL_GRADIENT = "from-stone-200 via-stone-100 to-emerald-100";

function ProductDetailPage() {
  const params = useParams<{ collection: string; part: string }>();
  const collectionId = params.collection;
  const part = parts.find((x) => x.slug === params.part);
  const [collectionName, setCollectionName] = useState("Koleksiyon");
  const regionLabels = Array.from({ length: part?.regions ?? 0 }, (_, i) => `${i + 2}. Bölge`);

  const [selection, setSelection] = useState<Record<string, Fabric | null>>({});
  const [pickerRegion, setPickerRegion] = useState<string | null>(null);
  const [view, setView] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCollection(collectionId);
        if (!cancelled && data?.name) setCollectionName(data.name);
      } catch {
        // Title stays placeholder until CRM product detail wiring.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  if (!part) {
    notFound();
    return null;
  }

  const allSelected = regionLabels.every((r) => selection[r]);
  const productTitle = `${collectionName.replace(" Koltuk Takımı", "")} ${part.name}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
      {/* SOL — 3D model & görseller */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className={`relative aspect-[4/3] bg-gradient-to-br ${DETAIL_GRADIENT} grid place-items-center`}>
          <ProductHero part={part.silhouette} view={view} selection={selection} regions={regionLabels} />

          <button className="absolute bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-5 h-11 rounded-full bg-[color:var(--istikbal-blue)] text-white font-semibold text-sm shadow-lg hover:bg-[color:var(--istikbal-navy)] transition-colors">
            <Box className="size-4" /> Evinizde Görün
          </button>
          <button onClick={() => setView((v) => (v + 1) % 3)} className="absolute top-5 right-5 size-10 grid place-items-center rounded-full bg-white/80 hover:bg-white text-[color:var(--istikbal-blue)] shadow-sm" title="Görünümü döndür">
            <RotateCw className="size-4" />
          </button>
          <span className="absolute top-5 left-5 text-[11px] font-bold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 bg-white/70 px-2.5 py-1 rounded-md">3D Önizleme</span>
        </div>

        {/* Küçük görseller */}
        <div className="flex gap-3 p-4 border-t border-black/5">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setView(i)}
              className={`h-20 w-24 rounded-xl border-2 transition-all ${
                view === i ? "border-[color:var(--istikbal-yellow)] ring-2 ring-[color:var(--istikbal-yellow)]/30" : "border-transparent hover:border-[color:var(--istikbal-blue)]/20"
              } bg-gradient-to-br ${DETAIL_GRADIENT} grid place-items-center`}
            >
              <span className="text-[10px] font-bold text-[color:var(--istikbal-blue)]/60">Görünüm {i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* SAĞ — varyant paneli */}
      <aside className="bg-white rounded-3xl border border-black/5 shadow-sm p-6 flex flex-col">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/45">{collectionName}</p>
          <h2 className="mt-1 text-xl font-extrabold text-[color:var(--istikbal-blue)] leading-tight">{productTitle}</h2>
        </div>

        {/* Şematik bölge haritası */}
        <div className="mb-5 rounded-2xl bg-[color:var(--istikbal-blue)]/5 p-4">
          <p className="text-xs font-bold text-[color:var(--istikbal-blue)] mb-2">KUMAŞ BÖLGELERİ</p>
          <div className="flex items-center gap-1.5 mb-2">
            {regionLabels.map((r, i) => (
              <div key={r} className="flex-1 h-2 rounded-full overflow-hidden bg-white">
                <div
                  className="h-full transition-all"
                  style={{ background: selection[r]?.bg || `hsl(${i * 60}, 70%, 60%)`, width: selection[r] ? "100%" : "30%" }}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-[color:var(--istikbal-blue)]/55 leading-relaxed">
            Bölge eşleşmesi: Ana gövde + sırt yastıkları + kol + minder. Her bölge için uygun kumaşı seçin.
          </p>
        </div>

        {/* Bölge seçimi */}
        <div className="space-y-2 flex-1">
          {regionLabels.map((r) => {
            const f = selection[r];
            return (
              <button
                key={r}
                onClick={() => setPickerRegion(r)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[color:var(--istikbal-blue)]/5 hover:bg-[color:var(--istikbal-blue)]/10 transition-colors group"
              >
                <span className="font-bold text-[color:var(--istikbal-blue)]">{r}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${f ? "text-[color:var(--istikbal-blue)]/80" : "text-[color:var(--istikbal-blue)]/50"}`}>
                    {f?.name || "Kumaş Seç"}
                  </span>
                  <span
                    className="size-7 rounded-md border border-black/10 shadow-inner"
                    style={{ background: f?.bg || "repeating-linear-gradient(45deg,#e5e7eb,#e5e7eb 4px,#f3f4f6 4px,#f3f4f6 8px)" }}
                  />
                  <ChevronRight className="size-4 text-[color:var(--istikbal-blue)]/40 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-6 space-y-2">
          <button
            disabled={!allSelected}
            className="w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] disabled:bg-[color:var(--istikbal-blue)]/15 disabled:text-[color:var(--istikbal-blue)]/40 disabled:cursor-not-allowed transition-all shadow-md"
          >
            <ShoppingCart className="size-4" /> Sepete Ekle
          </button>
          {!allSelected && (
            <p className="text-center text-xs font-semibold text-[#f0a400] bg-[color:var(--istikbal-yellow)]/15 py-2 rounded-xl">
              Lütfen her bölge için bir kumaş seçiniz
            </p>
          )}
        </div>
      </aside>

      {pickerRegion && (
        <FabricPicker
          region={pickerRegion}
          current={selection[pickerRegion]?.id}
          onClose={() => setPickerRegion(null)}
          onPick={(f) => {
            setSelection((s) => ({ ...s, [pickerRegion]: f }));
            setPickerRegion(null);
          }}
        />
      )}
    </div>
  );
}

/* ── Kumaş seçim modalı ── */
function FabricPicker({
  region, current, onClose, onPick,
}: { region: string; current?: string; onClose: () => void; onPick: (f: Fabric) => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-7 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 size-9 grid place-items-center rounded-full hover:bg-[color:var(--istikbal-blue)]/5 text-[color:var(--istikbal-blue)]/60">
          <X className="size-5" />
        </button>
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/45">{region}</p>
          <h3 className="text-2xl font-extrabold text-[color:var(--istikbal-blue)]">Uygun Kumaşlar</h3>
          <p className="text-sm text-[color:var(--istikbal-blue)]/55 mt-1">Sarı ikonlu kumaşlar bu bölge için özel uygulama gerektirir.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fabrics.map((f) => {
            const active = f.id === current;
            return (
              <button
                key={f.id}
                onClick={() => onPick(f)}
                className={`group text-left rounded-2xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                  active ? "border-[color:var(--istikbal-blue)] shadow-lg" : "border-transparent bg-[color:var(--istikbal-blue)]/5"
                }`}
              >
                <div className="relative h-36" style={{ background: f.bg }}>
                  {/* Doku katmanı */}
                  <div
                    className="absolute inset-0 opacity-40 mix-blend-overlay"
                    style={{ backgroundImage: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), transparent 60%), repeating-linear-gradient(45deg, rgba(0,0,0,.08) 0 2px, transparent 2px 5px)" }}
                  />
                  {f.warning && (
                    <span className="absolute bottom-2 right-2 size-7 grid place-items-center rounded-full bg-[color:var(--istikbal-yellow)] text-[color:var(--istikbal-blue)] shadow-md">
                      <AlertCircle className="size-4" />
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[color:var(--istikbal-blue)] text-white text-[11px] font-bold">
                      <Check className="size-3" /> Seçili
                    </span>
                  )}
                </div>
                <p className="px-4 py-3 font-semibold text-[color:var(--istikbal-blue)]">{f.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── 3B önizleme yerine renkli koltuk silüeti ── */
function ProductHero({
  part, view, selection, regions,
}: { part: "uclu" | "ikili" | "tekli" | "berjer" | "puf"; view: number; selection: Record<string, Fabric | null>; regions: string[] }) {
  const fillFor = (i: number) => selection[regions[i]]?.bg || "#ffffff";
  const rotate = view === 1 ? "rotate(-8deg)" : view === 2 ? "rotate(8deg) scale(0.95)" : "rotate(0)";

  if (part === "puf") {
    return (
      <svg viewBox="0 0 220 110" className="w-3/4 drop-shadow-2xl" style={{ transform: rotate }}>
        <rect x="10" y="25" width="200" height="60" rx="14" style={{ fill: fillFor(0) }} stroke="#0f3478" strokeOpacity=".1" />
        <rect x="10" y="60" width="200" height="25" rx="10" style={{ fill: fillFor(1) }} stroke="#0f3478" strokeOpacity=".1" />
      </svg>
    );
  }

  const w = part === "uclu" ? 360 : part === "ikili" ? 280 : 200;
  return (
    <svg viewBox={`0 0 ${w} 200`} className="w-[78%] drop-shadow-2xl" style={{ transform: rotate, transition: "transform 0.4s" }}>
      {/* gölge */}
      <ellipse cx={w / 2} cy="185" rx={w / 2.4} ry="8" fill="#000" opacity="0.1" />
      {/* gövde (1. bölge) */}
      <rect x="20" y="100" width={w - 40} height="70" rx="16" style={{ fill: fillFor(0) }} stroke="#0f3478" strokeOpacity=".15" />
      {/* sırt (2. bölge) */}
      <rect x="40" y="60" width={w - 80} height="50" rx="12" style={{ fill: fillFor(1) }} stroke="#0f3478" strokeOpacity=".15" />
      {/* kollar (3. bölge) */}
      <rect x="6" y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x={w - 36} y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      {/* minder/yastık (4. bölge) */}
      {regions.length >= 4 && (
        <>
          <rect x="60" y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
          <rect x={w - 120} y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
        </>
      )}
      {/* ayaklar */}
      <rect x="14" y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
      <rect x={w - 20} y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
    </svg>
  );
}

export default ProductDetailPage;
