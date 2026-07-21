import type { Metadata } from "next";
import CollectionsPage from "./CollectionsPage";

export const metadata: Metadata = {
  title: "Koleksiyonlar · İstikbal",
  description: "İstikbal koltuk ve kanepe koleksiyonları.",
};

export default function Page() {
  return <CollectionsPage />;
}
