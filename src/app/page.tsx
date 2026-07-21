import type { Metadata } from "next";
import Home from "./Home";

export const metadata: Metadata = {
  title: "İstikbal 3D Tasarım Stüdyosu",
  
};

export default function Page() {
  return <Home />;
}
