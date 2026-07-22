import type { Metadata } from "next";
import CollectionsPage from "./CollectionsPage";

export const metadata: Metadata = {
  title: "Kategoriler · İstikbal",
  description: "İstikbal ürün kategorileri.",
};

export default function Page() {
  return <CollectionsPage />;
}
