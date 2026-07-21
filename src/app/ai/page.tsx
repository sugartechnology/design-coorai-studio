import type { Metadata } from "next";
import AiStudioPage from "./AiStudioPage";

export const metadata: Metadata = {
  title: "AI Sahne Oluşturucu · İstikbal",
  description: "Yapay zeka ile oda sahneleri tasarlayın.",
};

export default function Page() {
  return <AiStudioPage />;
}
