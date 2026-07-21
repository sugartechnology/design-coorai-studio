import type { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata: Metadata = {
  title: "Giriş Yap · İstikbal 3D Tasarım Stüdyosu",
  description: "Bayi kodu ve SMS pin kodu ile İstikbal Bayi paneline güvenli giriş.",
};

export default function Page() {
  return <LoginPage />;
}
