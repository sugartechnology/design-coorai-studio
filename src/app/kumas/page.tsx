import type { Metadata } from "next";
import CollectionsPage from "./CollectionsPage";

export const metadata: Metadata = {
  title: "Kategoriler",
  description: "Ürün kategorileri.",
};

export default function Page() {
  return <CollectionsPage />;
}
