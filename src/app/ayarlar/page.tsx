import type { Metadata } from "next";
import AyarlarPage from "./AyarlarPage";

export const metadata: Metadata = {
  title: "Ayarlar · İstikbal",
  description: "Mağaza tercihleri, bildirim, görünüm ve entegrasyon ayarları.",
};

export default function Page() {
  return <AyarlarPage />;
}
