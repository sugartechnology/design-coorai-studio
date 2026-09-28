import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getPortalTemplate } from "@/lib/branding";
import LoginPage from "./LoginPage";

export async function generateMetadata(): Promise<Metadata> {
  const template = await getPortalTemplate();
  const t = await getTranslations("login");
  return {
    title: t("title"),
    description: t("metaDescription", { brand: template.displayName }),
  };
}

export default function Page() {
  return <LoginPage />;
}
