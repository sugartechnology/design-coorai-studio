import type { Metadata } from "next";
import { Suspense } from "react";
import ModulerPage from "./ModulerPage";

export const metadata: Metadata = {
  title: "Modüler Ürün",
  description: "Şirket configurator kataloğu ve 3D yapılandırıcı.",
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
      <ModulerPage />
    </Suspense>
  );
}
