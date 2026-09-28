import type { Metadata } from "next";
import ModulerPage from "./ModulerPage";

export const metadata: Metadata = {
  title: "Modüler Ürün",
  description: "Modüler kanepe yapılandırıcısı.",
};

export default function Page() {
  return <ModulerPage />;
}
