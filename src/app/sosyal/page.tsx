import type { Metadata } from "next";
import SosyalPage from "./SosyalPage";

export const metadata: Metadata = {
  title: "Sosyal Medya · İstikbal",
  description: "Renderlarını sosyal medyada paylaş.",
};

export default function Page() {
  return <SosyalPage />;
}
