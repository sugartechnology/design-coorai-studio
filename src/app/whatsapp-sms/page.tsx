import type { Metadata } from "next";
import WhatsappPage from "./WhatsappPage";

export const metadata: Metadata = {
  title: "WhatsApp & SMS · İstikbal",
  description: "Müşterilere toplu WhatsApp ve SMS kampanyası gönder.",
};

export default function Page() {
  return <WhatsappPage />;
}
