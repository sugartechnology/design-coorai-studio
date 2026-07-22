import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import ProductDetailPage from "./ProductDetailPage";

export default async function Page() {
  const t = await getTranslations("kumas");
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white border border-black/5 py-20 text-center text-sm text-[color:var(--istikbal-blue)]/60">
          {t("productsLoading")}
        </div>
      }
    >
      <ProductDetailPage />
    </Suspense>
  );
}
