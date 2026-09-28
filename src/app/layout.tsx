import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
// import { TutorialButton } from "@/components/TutorialButton";
import { CartProvider } from "@/lib/cart";
import { getPortalTemplate, templateCssVars } from "@/lib/branding";
import { readRequestHost } from "@/lib/templates/provider";
import { PortalTemplateProvider } from "@/lib/templates/context";
import { isRtlLocale } from "@/i18n/config";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const template = await getPortalTemplate();
  const t = await getTranslations("meta");
  const tCommon = await getTranslations("common");
  const brand = template.displayName;
  const title = t("title", {
    brand,
    tagline: tCommon("studioTagline"),
  });
  const description = t("description");
  const ogDescription = t("ogDescription");
  const favicon = template.assets.faviconUrl;
  const logo = template.assets.logoUrl;

  const host = await readRequestHost();
  const proto =
    process.env.NODE_ENV === "production" ? "https" : "http";
  const metadataBase = host ? new URL(`${proto}://${host}`) : undefined;

  return {
    metadataBase,
    title: {
      default: title,
      template: `%s · ${brand}`,
    },
    description,
    applicationName: brand,
    icons: {
      icon: [{ url: favicon, type: "image/svg+xml" }],
      shortcut: favicon,
      apple: favicon,
    },
    openGraph: {
      title,
      description: ogDescription,
      type: "website",
      siteName: brand,
      images: [{ url: logo, alt: brand }],
    },
    twitter: {
      card: "summary",
      title,
      description: ogDescription,
      images: [logo],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const template = await getPortalTemplate();

  return (
    <html lang={locale} dir={isRtlLocale(locale) ? "rtl" : "ltr"}>
      <body style={templateCssVars(template)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PortalTemplateProvider template={template}>
            <CartProvider>
              {children}
              {/* <TutorialButton /> */}
            </CartProvider>
          </PortalTemplateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
