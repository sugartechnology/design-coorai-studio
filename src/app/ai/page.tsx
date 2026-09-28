import type { Metadata } from "next";
import AiStudioPage from "./AiStudioPage";

export const metadata: Metadata = {
  title: "AI Sahne Oluşturucu",
  description: "Yapay zeka ile oda sahneleri tasarlayın.",
};

export default function Page() {
  return <AiStudioPage />;
}
