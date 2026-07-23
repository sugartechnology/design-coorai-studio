"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getCollection } from "@/lib/catalog";
import { parts, type Part } from "@/lib/kumas-data";

function CollectionPartsPage() {
  const params = useParams<{ collection: string }>();
  const collectionId = params.collection;
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const [collectionName, setCollectionName] = useState(tCommon("collectionFallback"));

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getCollection(collectionId);
        if (!cancelled && data?.name) setCollectionName(data.name);
      } catch {
        // Keep placeholder title; parts remain mock for this slice.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [collectionId]);

  return (
    <>
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/50">{t("collectionEyebrow")}</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
          {collectionName}
        </h1>
        <p className="mt-1.5 text-[color:var(--istikbal-blue)]/60">
          {t("collectionPartsHint")}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
        {parts.map((p) => (
          <Link
            key={p.slug}
            href={`/kumas/${collectionId}/${p.slug}`}
            className="group rounded-2xl bg-white shadow-sm hover:shadow-xl overflow-hidden transition-all hover:-translate-y-1 border border-black/5"
          >
            <div className="relative h-36 md:h-40 bg-gradient-to-br from-stone-200 via-stone-100 to-emerald-100 grid place-items-center overflow-hidden">
              <PartSilhouette type={p.silhouette} />
            </div>
            <div className="px-4 py-4 text-center">
              <h3 className="font-bold text-[color:var(--istikbal-blue)]">{p.name}</h3>
              <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{t("fabricRegionCount", { count: p.regions })}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function PartSilhouette({ type }: { type: Part["silhouette"] }) {
  const fill = "#ffffff";
  const accent = "#0f3478";
  if (type === "uclu" || type === "ikili") {
    const w = type === "uclu" ? 200 : 150;
    return (
      <svg viewBox={`0 0 ${w} 100`} className="w-3/4 drop-shadow">
        <rect x="10" y="45" width={w - 20} height="40" rx="10" fill={fill} />
        <rect x="4" y="55" width="20" height="38" rx="7" fill={fill} />
        <rect x={w - 24} y="55" width="20" height="38" rx="7" fill={fill} />
        <rect x="20" y="30" width={w - 40} height="22" rx="7" fill={fill} />
        <rect x="14" y="85" width="5" height="10" fill={accent} opacity="0.5" />
        <rect x={w - 19} y="85" width="5" height="10" fill={accent} opacity="0.5" />
      </svg>
    );
  }
  if (type === "tekli" || type === "berjer") {
    return (
      <svg viewBox="0 0 100 110" className="w-1/2 drop-shadow">
        <rect x="10" y="50" width="80" height="42" rx="10" fill={fill} />
        <rect x="4" y="58" width="18" height="38" rx="7" fill={fill} />
        <rect x="78" y="58" width="18" height="38" rx="7" fill={fill} />
        <rect x="18" y={type === "berjer" ? 10 : 28} width="64" height={type === "berjer" ? 44 : 26} rx="8" fill={fill} />
        <rect x="14" y="92" width="5" height="10" fill={accent} opacity="0.5" />
        <rect x="81" y="92" width="5" height="10" fill={accent} opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 60" className="w-1/2 drop-shadow">
      <rect x="6" y="14" width="88" height="30" rx="10" fill={fill} />
      <rect x="10" y="44" width="5" height="10" fill={accent} opacity="0.5" />
      <rect x="85" y="44" width="5" height="10" fill={accent} opacity="0.5" />
    </svg>
  );
}

export default CollectionPartsPage;
