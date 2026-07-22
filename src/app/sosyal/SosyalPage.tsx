"use client";

import Link from "next/link";
import { ArrowLeft, Instagram, Facebook, Share2, Check, Download, Heart, MessageCircle, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import sofa1 from "@/assets/sosyal/sofa1.jpg.asset.json";
import sofa2 from "@/assets/sosyal/sofa2.jpg.asset.json";
import sofa3 from "@/assets/sosyal/sofa3.jpg.asset.json";
import vanity from "@/assets/sosyal/vanity.jpg.asset.json";
import sideboard1 from "@/assets/sosyal/sideboard1.jpg.asset.json";
import sideboard2 from "@/assets/sosyal/sideboard2.jpg.asset.json";

type Render = {
  id: string;
  title: string;
  date: string;
  image: string;
};

const RENDERS: Render[] = [
  { id: "r1", title: "Bej Modern İkili Kanepe",       date: "12 Haz", image: sofa1.url },
  { id: "r2", title: "Beton Duvar Üçlü Kanepe",       date: "11 Haz", image: sofa2.url },
  { id: "r3", title: "Minimal Salon Takımı",          date: "10 Haz", image: sofa3.url },
  { id: "r4", title: "Arch Makyaj Konsolu",           date: "09 Haz", image: vanity.url },
  { id: "r5", title: "Arch Konsol & Çekmece",         date: "08 Haz", image: sideboard1.url },
  { id: "r6", title: "Naturel Meşe Konsol",           date: "07 Haz", image: sideboard2.url },
];


function SosyalPage() {
  const t = useTranslations("sosyal");
  const tCommon = useTranslations("common");
  const [connected, setConnected] = useState(false);
  const [query, setQuery] = useState("");
  const [shared, setShared] = useState<Record<string, "instagram" | "facebook" | null>>({});

  const filtered = RENDERS.filter(r => r.title.toLowerCase().includes(query.toLowerCase()));

  const share = (id: string, platform: "instagram" | "facebook") => {
    setShared(s => ({ ...s, [id]: platform }));
    setTimeout(() => setShared(s => ({ ...s, [id]: null })), 1800);
  };

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> {tCommon("back")}
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">{t("headerTitle")}</div>
        <div className="flex-1" />
      </header>

      <main className="px-6 lg:px-10 py-8 space-y-8">
        {/* Connect bar */}
        <section className="rounded-3xl overflow-hidden bg-gradient-to-br from-[#feda77] via-[#f58529] to-[#dd2a7b] p-[2px] shadow-sm">
          <div className="bg-white rounded-[22px] p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-[#feda77] via-[#f58529] to-[#dd2a7b] flex items-center justify-center text-white shrink-0">
              <Instagram className="size-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[color:var(--istikbal-blue)]">{t("connectTitle")}</h2>
                {connected && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <Check className="size-3" /> {tCommon("connected")}
                  </span>
                )}
              </div>
              <p className="text-sm text-[color:var(--istikbal-blue)]/60 mt-0.5">
                {connected ? t("connectedHint") : t("disconnectedHint")}
              </p>
            </div>
            <button
              onClick={() => setConnected(c => !c)}
              className={`h-11 px-5 rounded-xl font-semibold text-sm transition flex items-center gap-2 ${
                connected
                  ? "bg-black/5 text-[color:var(--istikbal-blue)] hover:bg-black/10"
                  : "bg-[color:var(--istikbal-blue)] text-white hover:opacity-90"
              }`}
            >
              {connected ? t("disconnect") : <><Plus className="size-4" /> {t("connectAccount")}</>}
            </button>
          </div>
        </section>

        {/* Renders header */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-xl font-bold text-[color:var(--istikbal-blue)]">{t("galleryTitle")}</h3>
              <p className="text-sm text-[color:var(--istikbal-blue)]/60">{t("gallerySubtitle")}</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-black/5 text-sm placeholder:text-[color:var(--istikbal-blue)]/40 text-[color:var(--istikbal-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--istikbal-blue)]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r) => (
              <article key={r.id} className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition group">
                {/* Image */}
                <div className="relative aspect-[4/5] bg-stone-100 overflow-hidden">
                  <img src={r.image} alt={r.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/85 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-semibold text-[color:var(--istikbal-blue)]">
                    {t("aiRenderBadge")}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/85 backdrop-blur px-2.5 py-1 rounded-full text-[11px] font-semibold text-[color:var(--istikbal-blue)]/70">
                    {r.date}
                  </div>
                  {shared[r.id] && (
                    <div className="absolute inset-0 bg-emerald-500/90 text-white flex items-center justify-center gap-2 font-semibold animate-in fade-in">
                      <Check className="size-5" /> {shared[r.id] === "instagram" ? t("sharedOnInstagram") : t("sharedOnFacebook")}
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-[color:var(--istikbal-blue)] leading-tight">{r.title}</h4>
                    <button className="text-[color:var(--istikbal-blue)]/40 hover:text-[color:var(--istikbal-blue)]" title={t("downloadTitle")}>
                      <Download className="size-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[color:var(--istikbal-blue)]/50">
                    <span className="flex items-center gap-1"><Heart className="size-3.5" /> 0</span>
                    <span className="flex items-center gap-1"><MessageCircle className="size-3.5" /> 0</span>
                    <span className="flex items-center gap-1"><Share2 className="size-3.5" /> 0</span>
                  </div>

                  {/* Share buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => share(r.id, "instagram")}
                      className="h-10 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 bg-gradient-to-br from-[#feda77] via-[#f58529] to-[#dd2a7b] hover:opacity-90 transition"
                    >
                      <Instagram className="size-4" /> {t("shareInstagram")}
                    </button>
                    <button
                      onClick={() => share(r.id, "facebook")}
                      className="h-10 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-1.5 bg-[#1877f2] hover:bg-[#1465d4] transition"
                    >
                      <Facebook className="size-4" /> {t("shareFacebook")}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center text-[color:var(--istikbal-blue)]/60">
              {tCommon("noResults")}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


export default SosyalPage;
