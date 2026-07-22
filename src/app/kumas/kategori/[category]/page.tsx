import type { Metadata } from "next";
import CategoryProductsPage from "./CategoryProductsPage";

export const metadata: Metadata = {
  title: "Kategori · İstikbal",
  description: "Kategoriye göre ürün listesi.",
};

export default function Page() {
  return <CategoryProductsPage />;
}
