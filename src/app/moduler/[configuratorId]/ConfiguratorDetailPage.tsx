"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { ConfiguratorHost } from "@/components/ConfiguratorHost";

export default function ConfiguratorDetailPage() {
  const t = useTranslations("moduler");
  const params = useParams<{ configuratorId: string }>();
  const searchParams = useSearchParams();
  const configuratorId = decodeURIComponent(params.configuratorId ?? "");
  const companyId = searchParams.get("companyId");

  const backHref =
    companyId && process.env.NODE_ENV === "development"
      ? `/moduler?companyId=${encodeURIComponent(companyId)}`
      : "/moduler";

  return (
    <div className="h-dvh min-h-0 flex flex-col bg-[color:var(--brand-bg)]">
      <AppHeader
        title={t("detailHeaderTitle", { id: configuratorId || "—" })}
        backHref={backHref}
        backLabel={t("backToList")}
        sticky
      />
      <main className="flex-1 min-h-0 px-4 lg:px-8 py-4 lg:py-6 overflow-hidden">
        <section className="h-full min-h-[520px] relative">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden relative h-full min-h-[520px]">
            {configuratorId ? (
              <ConfiguratorHost
                configuratorId={configuratorId}
                className="absolute inset-0 h-full w-full"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-[color:var(--brand-primary)]/50">
                {t("missingConfiguratorId")}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
