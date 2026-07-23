"use client";

import type { Part } from "@/lib/kumas-data";
import type { MaterialZoneArea, MaterialZoneOption } from "@/lib/material-zone";

type ProductHeroProps = {
  part: Part["silhouette"];
  view: number;
  areas: MaterialZoneArea[];
  selection: Record<string, MaterialZoneOption | null>;
};

export function ProductHero({
  part,
  view,
  areas,
  selection,
}: ProductHeroProps) {
  const fillFor = (i: number) => {
    const area = areas[i];
    if (!area) return "#ffffff";
    const selected = selection[area.name];
    if (selected?.image) return area.hexCode || "#d4d4d8";
    return area.hexCode || "#ffffff";
  };
  const rotate =
    view === 1 ? "rotate(-8deg)" : view === 2 ? "rotate(8deg) scale(0.95)" : "rotate(0)";

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
    <svg
      viewBox={`0 0 ${w} 200`}
      className="w-[78%] drop-shadow-2xl"
      style={{ transform: rotate, transition: "transform 0.4s" }}
    >
      <ellipse cx={w / 2} cy="185" rx={w / 2.4} ry="8" fill="#000" opacity="0.1" />
      <rect x="20" y="100" width={w - 40} height="70" rx="16" style={{ fill: fillFor(0) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x="40" y="60" width={w - 80} height="50" rx="12" style={{ fill: fillFor(1) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x="6" y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      <rect x={w - 36} y="80" width="30" height="80" rx="12" style={{ fill: fillFor(2) }} stroke="#0f3478" strokeOpacity=".15" />
      {areas.length >= 4 && (
        <>
          <rect x="60" y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
          <rect x={w - 120} y="80" width="60" height="30" rx="8" style={{ fill: fillFor(3) }} opacity="0.95" />
        </>
      )}
      <rect x="14" y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
      <rect x={w - 20} y="170" width="6" height="14" fill="#0f3478" opacity="0.6" />
    </svg>
  );
}
