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
  const onDarkAside =
    tone === "onAside" && !isLightHex(template.colors.loginAsideFrom);

  if (raster && !onDarkAside) {
    return (
      <span
        role="img"
        aria-label={template.displayName}
        className={cn(
          "block h-8 w-auto aspect-[392/58] bg-[color:var(--brand-primary)] sm:h-9",
          className,
        )}
        style={{
          WebkitMaskImage: `url(${logoUrl})`,
          maskImage: `url(${logoUrl})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskSize: "contain",
          maskSize: "contain",
          WebkitMaskPosition: "left center",
          maskPosition: "left center",
        }}
      />
    );
  }

  return (
    <img
      src={logoUrl}
      alt={template.displayName}
      className={cn(
        "block h-8 w-auto object-contain object-left sm:h-9",
        className,
      )}
    />
  );
}
