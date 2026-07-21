import type { Metadata } from "next";
import KullanicilarPage from "./KullanicilarPage";

export const metadata: Metadata = {
  title: "Kullanıcılar · İstikbal",
  description: "Ekip üyeleri, roller ve yetkiler.",
};

export default function Page() {
  return <KullanicilarPage />;
}
