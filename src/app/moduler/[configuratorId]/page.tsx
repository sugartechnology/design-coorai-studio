import type { Metadata } from "next";
import { Suspense } from "react";
import ConfiguratorDetailPage from "./ConfiguratorDetailPage";

export const metadata: Metadata = {
  title: "Modüler Configurator",
  description: "Modüler ürün yapılandırıcısı.",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-sm text-[color:var(--brand-primary)]/50">
          …
        </div>
      }
    >
      <ConfiguratorDetailPage />
    </Suspense>
  );
}
