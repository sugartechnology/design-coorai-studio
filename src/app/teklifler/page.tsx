import type { Metadata } from "next";
import OffersPage from "./OffersPage";

export const metadata: Metadata = {
  title: "Teklifler",
  description: "Teklifleri görüntüle ve oda planını aç.",
};

export default function Page() {
  return <OffersPage />;
}
