import type { Metadata } from "next";
import OffersPage from "./OffersPage";

export const metadata: Metadata = {
  title: "Teklifler · İstikbal",
  description: "Teklifleri görüntüle ve oda planını aç.",
};

export default function Page() {
  return <OffersPage />;
}
