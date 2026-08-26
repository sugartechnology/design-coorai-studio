"use client";

import { isLightHex } from "@/lib/templates/schema";
import { usePortalTemplate } from "@/lib/templates/context";
import { cn } from "@/lib/utils";

type BrandLogoTone = "brand" | "onAside";

type BrandLogoProps = {
  className?: string;
  tone?: BrandLogoTone;
};

function isRasterLogo(url: string): boolean {
  return /\.(png|jpe?g|webp)$/i.test(url);
}

export function BrandLogo({ className, tone = "brand" }: BrandLogoProps) {
  const template = usePortalTemplate();
  const { logoUrl } = template.assets;
  const raster = isRasterLogo(logoUrl);
  const asideIsDark =
    tone === "onAside" && !isLightHex(template.colors.loginAsideFrom);
  const invertRaster = raster && asideIsDark;

  return (
    <img
      src={logoUrl}
      alt={template.displayName}
      className={cn(
        "block h-8 w-auto object-contain object-left sm:h-9",
        invertRaster && "brightness-0 invert",
        className,
      )}
    />
  );
}
