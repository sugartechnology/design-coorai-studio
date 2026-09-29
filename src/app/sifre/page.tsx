import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import SifrePage from "./SifrePage";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("login");
  return { title: t("forcePasswordTitle") };
}

export default function Page() {
  return <SifrePage />;
}
