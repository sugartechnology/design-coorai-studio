"use client";

import { ChevronRight, ImageIcon, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { usePortalTemplate } from "@/lib/templates/context";

type ConfiguratorListItem = {
  configuratorId: number | string;
  name?: string | null;
  thumbnail?: string | null;
};

type LoadState =
  | { status: "loading" }
  | { status: "ready"; items: ConfiguratorListItem[] }
  | { status: "error"; message: string }
  | { status: "no-company" };

const IS_DEV = process.env.NODE_ENV === "development";

function parseCompanyId(raw: string | null | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) return null;
  return n;
}

function ModulerPage() {
  const t = useTranslations("moduler");
  const router = useRouter();
  const searchParams = useSearchParams();
  const template = usePortalTemplate();
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [overrideInput, setOverrideInput] = useState("");
  const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [brokenThumbs, setBrokenThumbs] = useState<Record<string, true>>({});

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/auth/session", { credentials: "include" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          rrCompanyId?: number | null;
        };
        if (cancelled) return;
        // Prefer session RapidRender id; fall back to brand template (same as /kumas).
        const rr =
          typeof data.rrCompanyId === "number" && Number.isFinite(data.rrCompanyId)
            ? data.rrCompanyId
            : template.rrCompanyId;
        const fromQuery = parseCompanyId(searchParams.get("companyId"));
        const initial =
          IS_DEV && fromQuery != null ? fromQuery : rr;
        setActiveCompanyId(initial);
        if (IS_DEV && fromQuery != null) {
          setOverrideInput(String(fromQuery));
        } else if (rr != null) {
          setOverrideInput(String(rr));
        }
      } catch {
        if (!cancelled) {
          setActiveCompanyId(template.rrCompanyId);
        }
      } finally {
        if (!cancelled) setSessionLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // Only resolve session once on mount; query override applied then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.rrCompanyId]);

  const loadCompany = useCallback(async (companyId: number) => {
    setLoadState({ status: "loading" });
    setBrokenThumbs({});
    try {
      const res = await fetch(`/api/configurator/company/${companyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: "{}",
      });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const errBody = (await res.json()) as { error?: string };
          if (errBody.error) message = errBody.error;
        } catch {
          /* ignore */
        }
        setLoadState({ status: "error", message });
        return;
      }
      const data: unknown = await res.json();
      const list = Array.isArray(data)
        ? (data as ConfiguratorListItem[]).filter(
            (item) =>
              item != null &&
              item.configuratorId != null &&
              String(item.configuratorId).length > 0,
          )
        : [];
      setLoadState({ status: "ready", items: list });
    } catch (err) {
      setLoadState({
        status: "error",
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  }, []);

  useEffect(() => {
    if (!sessionLoaded) return;
    if (activeCompanyId == null) {
      setLoadState({ status: "no-company" });
      return;
    }
    void loadCompany(activeCompanyId);

    if (IS_DEV) {
      const url = new URL(window.location.href);
      url.searchParams.set("companyId", String(activeCompanyId));
      window.history.replaceState(null, "", url);
    }
  }, [sessionLoaded, activeCompanyId, loadCompany]);

  const filteredItems = useMemo(() => {
    if (loadState.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return loadState.items;
    return loadState.items.filter((item) => {
      const name = (item.name ?? "").toLowerCase();
      const id = String(item.configuratorId).toLowerCase();
      return name.includes(q) || id.includes(q);
    });
  }, [loadState, query]);

  const applyOverride = () => {
    if (!IS_DEV) return;
    const id = parseCompanyId(overrideInput);
    if (id != null) setActiveCompanyId(id);
  };

  const openConfigurator = (id: number | string) => {
    const params = new URLSearchParams();
    if (activeCompanyId != null) params.set("companyId", String(activeCompanyId));
    const qs = params.toString();
    router.push(`/moduler/${encodeURIComponent(String(id))}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)]">
      <AppHeader title={t("headerTitle")} backHref="/" sticky />

      <main className="px-4 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[color:var(--brand-primary)]">
              {t("catalogTitle")}
            </h1>
            <p className="text-sm text-[color:var(--brand-primary)]/60 mt-1">
              {t("catalogSubtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-72">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-primary)]/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-white border border-black/5 text-sm text-[color:var(--brand-primary)] outline-none focus:border-[color:var(--brand-primary)]/30"
              />
            </div>
            {IS_DEV && (
              <form
                className="flex items-center gap-2 h-11 px-3 rounded-xl bg-white border border-black/5"
                onSubmit={(e) => {
                  e.preventDefault();
                  applyOverride();
                }}
              >
                <label
                  htmlFor="moduler-company-override"
                  className="text-[11px] font-semibold text-[color:var(--brand-primary)]/50 whitespace-nowrap"
                >
                  {t("companyOverrideLabel")}
                </label>
                <input
                  id="moduler-company-override"
                  type="number"
                  min={1}
                  value={overrideInput}
                  onChange={(e) => setOverrideInput(e.target.value)}
                  className="w-16 bg-transparent text-sm text-[color:var(--brand-primary)] outline-none"
                />
                <button
                  type="submit"
                  className="h-8 px-3 rounded-lg bg-[color:var(--brand-primary)] text-white text-xs font-semibold hover:opacity-90"
                >
                  {t("companyOverrideLoad")}
                </button>
              </form>
            )}
          </div>
        </div>

        {loadState.status === "loading" && (
          <div className="bg-white rounded-2xl p-10 text-center text-sm text-[color:var(--brand-primary)]/50">
            {t("loading")}
          </div>
        )}

        {loadState.status === "no-company" && (
          <div className="bg-white rounded-2xl p-10 text-center text-sm text-[color:var(--brand-primary)]/50">
            {t("noCompanyId")}
          </div>
        )}

        {loadState.status === "error" && (
          <div className="bg-white rounded-2xl p-10 text-center">
            <p className="text-sm font-semibold text-red-600">{t("loadErrorTitle")}</p>
            <p className="text-sm text-[color:var(--brand-primary)]/50 mt-1">
              {loadState.message}
            </p>
          </div>
        )}

        {loadState.status === "ready" && filteredItems.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center text-sm text-[color:var(--brand-primary)]/50">
            {loadState.items.length === 0
              ? t("emptyCompany", { companyId: String(activeCompanyId ?? "—") })
              : t("emptySearch")}
          </div>
        )}

        {loadState.status === "ready" && filteredItems.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const idKey = String(item.configuratorId);
              const name = item.name?.trim() || t("untitled");
              const thumbBroken = Boolean(brokenThumbs[idKey]);
              const showImg = Boolean(item.thumbnail) && !thumbBroken;
              return (
                <button
                  key={idKey}
                  type="button"
                  onClick={() => openConfigurator(item.configuratorId)}
                  className="group bg-white rounded-2xl shadow-sm overflow-hidden text-left hover:shadow-lg transition border border-transparent hover:border-[color:var(--brand-primary)]/20"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-stone-50 to-stone-100 relative flex items-center justify-center overflow-hidden">
                    {showImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail!}
                        alt={name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() =>
                          setBrokenThumbs((prev) => ({ ...prev, [idKey]: true }))
                        }
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-[color:var(--brand-primary)]/30">
                        <ImageIcon className="size-10" strokeWidth={1.25} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {t("noPreview")}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--brand-primary)]/50">
                      {t("cardIdLabel", { id: idKey })}
                    </div>
                    <div className="text-sm font-bold text-[color:var(--brand-primary)] mt-0.5 line-clamp-1">
                      {name}
                    </div>
                    <div className="flex items-center justify-end mt-2">
                      <span className="text-[11px] font-semibold text-[color:var(--brand-primary)]/60 group-hover:text-[color:var(--brand-primary)] flex items-center gap-0.5">
                        {t("customize")} <ChevronRight className="size-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default ModulerPage;
