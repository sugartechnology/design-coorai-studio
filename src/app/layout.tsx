import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { TutorialButton } from "@/components/TutorialButton";
import { CartProvider } from "@/lib/cart";
import { getPortalTemplate, templateCssVars } from "@/lib/branding";
import { PortalTemplateProvider } from "@/lib/templates/context";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const template = await getPortalTemplate();
  const t = await getTranslations("meta");
  const tCommon = await getTranslations("common");
  const title = t("title", {
    brand: template.displayName,
    tagline: tCommon("studioTagline"),
  });
  return {
    title,
    description: t("description"),
    icons: {
      icon: template.assets.faviconUrl,
    },
    openGraph: {
      title,
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
  const template = await getPortalTemplate();

  return (
    <html lang={locale}>
      <body style={templateCssVars(template)}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <PortalTemplateProvider template={template}>
            <CartProvider>
              {children}
              <TutorialButton />
            </CartProvider>
          </PortalTemplateProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
