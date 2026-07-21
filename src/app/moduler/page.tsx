import type { Metadata } from "next";
import ModulerPage from "./ModulerPage";

export const metadata: Metadata = {
  title: "Modüler Ürün · İstikbal",
  description: "Modüler kanepe yapılandırıcısı.",
};

export default function Page() {
  return <ModulerPage />;
}
