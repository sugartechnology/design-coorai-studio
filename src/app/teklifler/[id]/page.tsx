import type { Metadata } from "next";
import OfferDetailPage from "./OfferDetailPage";

export const metadata: Metadata = {
  title: "Teklif · İstikbal",
  description: "Teklifi görüntüle ve düzenle.",
};

export default function Page() {
  return <OfferDetailPage />;
}
