import type { Metadata } from "next";
import { Suspense } from "react";
import AyarlarPage from "./AyarlarPage";

export const metadata: Metadata = {
  title: "Ayarlar · İstikbal",
  description: "Mağaza tercihleri, bildirim, görünüm ve entegrasyon ayarları.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[color:var(--brand-bg)]" />
      }
    >
      <AyarlarPage />
    </Suspense>
  );
}
