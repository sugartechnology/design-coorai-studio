import type { CSSProperties } from "react";
import type { PortalTemplate } from "./schema";

export function templateCssVars(template: PortalTemplate): CSSProperties {
  const { colors } = template;
  return {
    "--brand-primary": colors.primary,
    "--brand-primary-strong": colors.primaryStrong,
    "--brand-accent": colors.accent,
    "--brand-bg": colors.background,
    "--brand-soft": colors.soft,
    "--brand-surface": colors.surface,
    "--brand-text": colors.text,
    "--brand-muted": colors.muted,
    "--brand-border": colors.border,
  } as CSSProperties;
}
