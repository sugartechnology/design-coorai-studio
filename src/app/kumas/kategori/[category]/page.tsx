import type { Metadata } from "next";
import CategoryProductsPage from "./CategoryProductsPage";

export const metadata: Metadata = {
  title: "Kategori",
  description: "Kategoriye göre ürün listesi.",
};

export default function Page() {
  return <CategoryProductsPage />;
}
