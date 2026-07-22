import { Suspense } from "react";
import ProductDetailPage from "./ProductDetailPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl bg-white border border-black/5 py-20 text-center text-sm text-[color:var(--istikbal-blue)]/60">
          Ürün yükleniyor…
        </div>
      }
    >
      <ProductDetailPage />
    </Suspense>
  );
}
