import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { TutorialButton } from "@/components/TutorialButton";
import { getPortalTheme } from "@/lib/branding";
import "./globals.css";

export const metadata: Metadata = {
  title: "İstikbal 3D Tasarım Stüdyosu",
  description:
    "Mobilya mağazaları için 3D tasarım, kumaş seçimi, yapay zeka destekli oda planlama ve modüler ürün yönetimi.",
  openGraph: {
    title: "İstikbal 3D Tasarım Stüdyosu",
    description: "Kumaş seç, yapay zeka ile tasarla, oda planla ve mağazanı tek panelden yönet.",
    type: "website",
  },
  twitter: {
    card: "summary",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = await getPortalTheme();
  const themeStyles = {
    "--istikbal-blue": theme.primary,
    "--istikbal-navy": theme.primaryStrong,
    "--istikbal-yellow": theme.accent,
    "--istikbal-bg": theme.background,
    "--istikbal-blue-soft": theme.soft,
  } as CSSProperties;

  return (
    <html lang="tr">
      <body style={themeStyles}>
        {children}
        <TutorialButton />
      </body>
    </html>
  );
}
