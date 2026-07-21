import type { Metadata } from "next";
import MobileUploadPage from "./MobileUploadPage";

export const metadata: Metadata = {
  title: "Oda Görseli Yükle · İstikbal",
  description: "Telefonunuzdan oda görseli yükleyin.",
};

export default function Page() {
  return <MobileUploadPage />;
}
