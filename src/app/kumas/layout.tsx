"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";

export default function KumasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/kumas";
  const t = useTranslations("kumas");
  const tCommon = useTranslations("common");
  const segs = pathname.replace(/^\/kumas\/?/, "").split("/").filter(Boolean);
  const title = segs.length === 0
    ? t("layoutTitleRoot")
    : segs.map(s => decodeURIComponent(s).replace(/-/g, " ")).join(" · ").toUpperCase();

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> {tCommon("back")}
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70 truncate">{title}</div>
        <div className="flex-1" />
      </header>

      <main className="px-6 lg:px-10 py-8">
        {children}
      </main>
    </div>
  );
}
