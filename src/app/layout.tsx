import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { TutorialButton } from "@/components/TutorialButton";
import { CartProvider } from "@/lib/cart";
import { getPortalTheme } from "@/lib/branding";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("ogDescription"),
      type: "website",
    },
    twitter: {
      card: "summary",
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const theme = await getPortalTheme();
  const themeStyles = {
    "--istikbal-blue": theme.primary,
    "--istikbal-navy": theme.primaryStrong,
    "--istikbal-yellow": theme.accent,
    "--istikbal-bg": theme.background,
    "--istikbal-blue-soft": theme.soft,
  } as CSSProperties;

  return (
    <html lang={locale}>
      <body style={themeStyles}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <CartProvider>
            {children}
            <TutorialButton />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
