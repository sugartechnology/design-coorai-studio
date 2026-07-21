import "server-only";

export type PortalTheme = {
  primary: string;
  primaryStrong: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  soft: string;
  logoUrl?: string;
  faviconUrl?: string;
};

export const fallbackTheme: PortalTheme = {
  primary: "#1f5fa8",
  primaryStrong: "#143d6b",
  accent: "#f5c518",
  background: "#f4f7fb",
  surface: "#ffffff",
  text: "#1f5fa8",
  muted: "#7892ae",
  border: "#dfe6ef",
  soft: "#e8f0fa",
};

/** CRM branding endpoint henüz yok; sabit tema kullan. */
export async function getPortalTheme(): Promise<PortalTheme> {
  return fallbackTheme;
}
