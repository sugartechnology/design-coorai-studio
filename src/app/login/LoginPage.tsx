"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Store,
  Phone,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  KeyRound,
  Info,
  UserRound,
  Lock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/BrandLogo";
import { isLightHex } from "@/lib/templates/schema";
import { usePortalTemplate } from "@/lib/templates/context";

type AuthTab = "credentials" | "dealer";
type Step = "code" | "phone" | "pin";
type CredentialsStep = "form" | "companies";

type PhoneOption = {
  phoneId: string;
  label: string;
  maskedNumber: string;
  admin: boolean;
};

type LookupResult = {
  status: "READY" | "NEEDS_PROVISION";
  dealerCode: string;
  dealerName: string;
  phones: PhoneOption[];
  message?: string;
};

type LoginCompanyOption = {
  companyId: string;
  name?: string;
  slug?: string | null;
  available?: boolean;
  status?: string | null;
};

function LoginPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const template = usePortalTemplate();
  const asideIsLight = isLightHex(template.colors.loginAsideFrom);
  const [tab, setTab] = useState<AuthTab>("credentials");
  const [credentialsStep, setCredentialsStep] = useState<CredentialsStep>("form");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectionToken, setSelectionToken] = useState<string | null>(null);
  const [companies, setCompanies] = useState<LoginCompanyOption[]>([]);
  const [selectingCompanyId, setSelectingCompanyId] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("code");
  const [dealerCode, setDealerCode] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<PhoneOption | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

  const resetCredentialsFlow = () => {
    setCredentialsStep("form");
    setSelectionToken(null);
    setCompanies([]);
    setSelectingCompanyId(null);
  };

  const switchTab = (next: AuthTab) => {
    if (next === tab || busy) return;
    setTab(next);
    setError(null);
    setBusy(false);
    if (next === "dealer") {
      setStep("code");
    } else {
      resetCredentialsFlow();
    }
  };

  const finishAuthenticated = () => {
    router.push("/");
    router.refresh();
  };

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: username.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.status === "COMPANY_SELECTION_REQUIRED" && data.selectionToken) {
        setSelectionToken(data.selectionToken);
        setCompanies(
          Array.isArray(data.companies)
            ? data.companies.filter(
                (c: LoginCompanyOption) => typeof c?.companyId === "string",
              )
            : [],
        );
        setCredentialsStep("companies");
        setError(null);
        return;
      }
      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("errorCredentialsInvalid"),
        );
        return;
      }
      finishAuthenticated();
    } catch {
      setError(t("errorLoginUnreachable"));
    } finally {
      setBusy(false);
    }
  };

  const selectCompany = async (company: LoginCompanyOption) => {
    if (!selectionToken || !company.companyId || busy || company.available === false) {
      return;
    }
    setSelectingCompanyId(company.companyId);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login/company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectionToken,
          companyId: company.companyId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("errorCompanySelectFailed"),
        );
        if (data.errorCode === "LOGIN_SELECTION_EXPIRED") {
          resetCredentialsFlow();
        }
        return;
      }
      finishAuthenticated();
    } catch {
      setError(t("errorLoginUnreachable"));
    } finally {
      setBusy(false);
      setSelectingCompanyId(null);
    }
  };

  const submitCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerCode.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dealer-auth/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealerCode: dealerCode.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : t("errorDealerNotFound"),
        );
        return;
      }
      setLookup(data as LookupResult);
      setSelectedPhone(null);
      setSessionId(null);
      setPin("");
      setStep("phone");
    } catch {
      setError(t("errorDealerUnreachable"));
    } finally {
      setBusy(false);
    }
  };

  const chooseAndSend = async (phone: PhoneOption) => {
    if (!lookup || busy) return;
    setSelectedPhone(phone);
    setBusy(true);
    setError(null);
    try {
      const endpoint =
        lookup.status === "NEEDS_PROVISION"
          ? "/api/dealer-auth/provision"
          : "/api/dealer-auth/otp/send";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealerCode: lookup.dealerCode,
          phoneId: phone.phoneId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === "string"
            ? data.error
            : typeof data.message === "string"
              ? data.message
              : t("errorSmsSendFailed"),
        );
        return;
      }
      if (!data.sessionId) {
        setError(t("errorSessionCreate"));
        return;
      }
      setSessionId(data.sessionId);
      setPin("");
      setStep("pin");
    } catch {
      setError(t("errorSmsUnreachable"));
    } finally {
      setBusy(false);
    }
  };

  const submitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || pin.length < 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dealer-auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, code: pin }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setError(
          typeof data.error === "string"
            ? data.error
            : t("errorPinInvalid"),
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError(t("errorVerifyUnreachable"));
    } finally {
      setBusy(false);
    }
  };

  const hint =
    tab === "credentials"
      ? credentialsStep === "companies"
        ? t("companySelectHint")
        : t("credentialsHint")
      : step === "code"
        ? t("stepCodeHint")
        : step === "phone" && lookup?.status === "NEEDS_PROVISION"
          ? t("stepPhoneProvisionHint")
          : step === "phone"
            ? t("stepPhoneReadyHint")
            : t("stepPinHint");

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[color:var(--brand-bg)]">
      <aside
        className={`relative hidden lg:flex flex-col justify-between p-12 overflow-hidden ${
          asideIsLight ? "text-[color:var(--brand-primary)]" : "text-white"
        }`}
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${template.colors.loginAsideFrom}, ${template.colors.loginAsideTo})`,
        }}
      >
        <div className="relative z-10">
          <BrandLogo tone="onAside" className="h-9 sm:h-10" />
        </div>

        <div
          className={`pointer-events-none absolute -left-32 -bottom-32 w-[520px] h-[520px] rounded-full blur-[2px] ${
            asideIsLight ? "bg-white/70" : "bg-white/10"
          }`}
        />
        <div className="pointer-events-none absolute right-10 top-32 w-40 h-40 rounded-full bg-white/30" />
        <div className="pointer-events-none absolute right-32 bottom-40 w-24 h-24 rounded-full bg-white/20" />

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight whitespace-pre-line">
            {t("asideTitle")}
          </h1>
          <p className="mt-5 text-lg leading-relaxed opacity-70">
            {t("asideBody")}
          </p>
          <div className="mt-10 flex items-center gap-6 text-sm font-medium opacity-70">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> {t("featureDealerCode")}</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> {t("featureSmsPin")}</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> {t("featureSecure")}</span>
          </div>
        </div>

        <p className="relative z-10 text-xs opacity-60">
          {t("footerCopyright", {
            year: new Date().getFullYear(),
            brand: template.displayName,
            tagline: tCommon("studioTagline"),
          })}
        </p>
      </aside>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <BrandLogo className="h-8" />
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-[color:var(--brand-primary)] tracking-tight">{t("title")}</h2>
            <p className="mt-2 text-[color:var(--brand-primary)]/60">{hint}</p>
          </div>

          <div className="mb-6 p-1 rounded-2xl bg-[color:var(--brand-primary)]/5 flex gap-1">
            {(
              [
                { id: "credentials" as const, label: t("tabCredentials") },
                { id: "dealer" as const, label: t("tabDealer") },
              ] as const
            ).map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={busy}
                  onClick={() => switchTab(item.id)}
                  className={`flex-1 h-11 rounded-xl text-sm font-bold tracking-wide transition-all disabled:opacity-60 ${
                    active
                      ? "bg-white text-[color:var(--brand-primary)] shadow-sm"
                      : "text-[color:var(--brand-primary)]/55 hover:text-[color:var(--brand-primary)]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {tab === "dealer" && (
            <div className="flex items-center gap-2 mb-6">
              {(["code", "phone", "pin"] as const).map((s, i) => {
                const active = step === s;
                const done = ["code", "phone", "pin"].indexOf(step) > i;
                return (
                  <div key={s} className="flex-1 flex items-center gap-2">
                    <div
                      className={`size-7 rounded-full grid place-items-center text-xs font-bold transition-all ${
                        done
                          ? "bg-[color:var(--brand-primary)] text-white"
                          : active
                          ? "bg-[color:var(--brand-accent)] text-[color:var(--brand-primary)]"
                          : "bg-[color:var(--brand-primary)]/10 text-[color:var(--brand-primary)]/50"
                      }`}
                    >
                      {done ? <CheckCircle2 className="size-4" /> : i + 1}
                    </div>
                    {i < 2 && <div className={`flex-1 h-0.5 ${done ? "bg-[color:var(--brand-primary)]" : "bg-[color:var(--brand-primary)]/10"}`} />}
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {tab === "credentials" && credentialsStep === "form" && (
            <form onSubmit={submitCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[color:var(--brand-primary)] mb-1.5">
                  {t("usernameLabel")}
                </label>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--brand-primary)]/40" />
                  <input
                    autoFocus
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    className="w-full pl-11 pr-4 h-13 rounded-2xl bg-[color:var(--brand-primary)]/5 border border-transparent focus:bg-white focus:border-[color:var(--brand-primary)]/20 focus:ring-4 focus:ring-[color:var(--brand-accent)]/30 outline-none text-[color:var(--brand-primary)] placeholder:text-[color:var(--brand-primary)]/35 transition-all font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[color:var(--brand-primary)] mb-1.5">
                  {t("passwordLabel")}
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--brand-primary)]/40" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="w-full pl-11 pr-4 h-13 rounded-2xl bg-[color:var(--brand-primary)]/5 border border-transparent focus:bg-white focus:border-[color:var(--brand-primary)]/20 focus:ring-4 focus:ring-[color:var(--brand-accent)]/30 outline-none text-[color:var(--brand-primary)] placeholder:text-[color:var(--brand-primary)]/35 transition-all font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || !username.trim() || !password}
                className="group w-full h-13 rounded-2xl bg-[color:var(--brand-primary)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--brand-primary-strong)] active:scale-[0.99] shadow-lg shadow-[color:var(--brand-primary)]/25 transition-all disabled:opacity-60"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    {t("submitLogin")}{" "}
                    <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="w-full text-sm font-semibold text-[color:var(--brand-primary)]/70 hover:text-[color:var(--brand-primary)] hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </form>
          )}

          {tab === "credentials" && credentialsStep === "companies" && (
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[color:var(--brand-primary)]">
                {t("chooseCompanyPrompt")}
              </p>
              <div className="space-y-2">
                {companies.map((company) => {
                  const available = company.available !== false;
                  const selecting = selectingCompanyId === company.companyId;
                  return (
                    <button
                      key={company.companyId}
                      type="button"
                      disabled={busy || !available}
                      onClick={() => selectCompany(company)}
                      className="w-full text-left p-4 rounded-2xl border-2 border-[color:var(--brand-primary)]/10 hover:border-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      <div className="size-10 rounded-xl bg-[color:var(--brand-accent)]/30 grid place-items-center shrink-0">
                        <Store className="size-4.5 text-[color:var(--brand-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[color:var(--brand-primary)] text-sm truncate">
                          {company.name || company.slug || company.companyId}
                        </p>
                        {company.slug && (
                          <p className="text-xs text-[color:var(--brand-primary)]/60 mt-0.5">
                            {company.slug}
                          </p>
                        )}
                        {!available && (
                          <p className="text-xs text-amber-700 mt-0.5">
                            {t("companyUnavailable")}
                          </p>
                        )}
                      </div>
                      {selecting ? (
                        <Loader2 className="size-4 animate-spin text-[color:var(--brand-primary)]" />
                      ) : (
                        <ArrowRight className="size-4 text-[color:var(--brand-primary)]/40" />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  resetCredentialsFlow();
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-primary)]/60 hover:text-[color:var(--brand-primary)]"
              >
                <ChevronLeft className="size-4" /> {t("backToCredentials")}
              </button>
            </div>
          )}

          {tab === "dealer" && step === "code" && (
            <form onSubmit={submitCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[color:var(--brand-primary)] mb-1.5">
                  {t("dealerCodeLabel")}
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--brand-primary)]/40" />
                  <input
                    autoFocus
                    type="text"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    maxLength={13}
                    placeholder={t("dealerCodePlaceholder")}
                    className="w-full pl-11 pr-4 h-13 rounded-2xl bg-[color:var(--brand-primary)]/5 border border-transparent focus:bg-white focus:border-[color:var(--brand-primary)]/20 focus:ring-4 focus:ring-[color:var(--brand-accent)]/30 outline-none text-[color:var(--brand-primary)] placeholder:text-[color:var(--brand-primary)]/35 transition-all tracking-wider font-semibold"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[color:var(--brand-primary)]/50">
                  {t("dealerCodeHelp")}
                </p>
              </div>

              <div className="flex gap-2.5 p-3.5 rounded-2xl bg-[color:var(--brand-accent)]/25 border border-[color:var(--brand-accent)]/40">
                <Info className="size-4.5 shrink-0 text-[color:var(--brand-primary)] mt-0.5" />
                <p className="text-xs leading-relaxed text-[color:var(--brand-primary)]/80">
                  {t("passwordExpiryInfo")}
                </p>
              </div>

              <button
                type="submit"
                disabled={busy || !dealerCode.trim()}
                className="group w-full h-13 rounded-2xl bg-[color:var(--brand-primary)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--brand-primary-strong)] active:scale-[0.99] shadow-lg shadow-[color:var(--brand-primary)]/25 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>{t("continue")} <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </button>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="w-full text-sm font-semibold text-[color:var(--brand-primary)]/70 hover:text-[color:var(--brand-primary)] hover:underline"
              >
                {t("forgotPassword")}
              </button>
            </form>
          )}

          {tab === "dealer" && step === "phone" && lookup && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[color:var(--brand-primary)]/5">
                <p className="text-xs font-semibold text-[color:var(--brand-primary)]/60 uppercase tracking-wider">{t("dealerLabel")}</p>
                <p className="mt-0.5 font-bold text-[color:var(--brand-primary)]">{lookup.dealerName}</p>
              </div>

              <p className="text-sm font-semibold text-[color:var(--brand-primary)]">
                {t("choosePhonePrompt")}
              </p>

              <div className="space-y-2">
                {lookup.phones.map((p) => (
                  <button
                    key={p.phoneId}
                    type="button"
                    disabled={busy}
                    onClick={() => chooseAndSend(p)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-[color:var(--brand-primary)]/10 hover:border-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <div className="size-10 rounded-xl bg-[color:var(--brand-accent)]/30 grid place-items-center shrink-0">
                      <Phone className="size-4.5 text-[color:var(--brand-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--brand-primary)] text-sm truncate">{p.label}</p>
                      <p className="text-xs text-[color:var(--brand-primary)]/60 mt-0.5 tracking-wider">{p.maskedNumber}</p>
                    </div>
                    {busy && selectedPhone?.phoneId === p.phoneId ? (
                      <Loader2 className="size-4 animate-spin text-[color:var(--brand-primary)]" />
                    ) : (
                      <ArrowRight className="size-4 text-[color:var(--brand-primary)]/40" />
                    )}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStep("code");
                  setError(null);
                }}
                className="flex items-center gap-1 text-sm font-semibold text-[color:var(--brand-primary)]/60 hover:text-[color:var(--brand-primary)]"
              >
                <ChevronLeft className="size-4" /> {t("changeDealerCode")}
              </button>
            </div>
          )}

          {tab === "dealer" && step === "pin" && selectedPhone && (
            <form onSubmit={submitPin} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[color:var(--brand-accent)]/25 border border-[color:var(--brand-accent)]/40 flex gap-2.5">
                <CheckCircle2 className="size-4.5 shrink-0 text-[color:var(--brand-primary)] mt-0.5" />
                <p className="text-xs leading-relaxed text-[color:var(--brand-primary)]/80">
                  {t("pinSentNotice", { masked: selectedPhone.maskedNumber })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[color:var(--brand-primary)] mb-1.5">
                  {t("smsPinLabel")}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--brand-primary)]/40" />
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder={t("smsPinPlaceholder")}
                    className="w-full pl-11 pr-4 h-14 rounded-2xl bg-[color:var(--brand-primary)]/5 border border-transparent focus:bg-white focus:border-[color:var(--brand-primary)]/20 focus:ring-4 focus:ring-[color:var(--brand-accent)]/30 outline-none text-[color:var(--brand-primary)] placeholder:text-[color:var(--brand-primary)]/35 transition-all text-center text-2xl font-bold tracking-[0.5em]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || pin.length < 4}
                className="group w-full h-13 rounded-2xl bg-[color:var(--brand-primary)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--brand-primary-strong)] active:scale-[0.99] shadow-lg shadow-[color:var(--brand-primary)]/25 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>{t("submitLogin")} <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="flex items-center gap-1 font-semibold text-[color:var(--brand-primary)]/60 hover:text-[color:var(--brand-primary)]"
                >
                  <ChevronLeft className="size-4" /> {t("changeNumber")}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => selectedPhone && chooseAndSend(selectedPhone)}
                  className="font-semibold text-[color:var(--brand-primary)]/70 hover:text-[color:var(--brand-primary)] hover:underline disabled:opacity-50"
                >
                  {t("resend")}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      {forgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}
    </div>
  );
}

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute left-4 top-4 flex items-center gap-1 text-sm text-[color:var(--brand-primary)]/60 hover:text-[color:var(--brand-primary)]">
          <ChevronLeft className="size-4" /> {tCommon("close")}
        </button>
        <div className="mt-6 mb-5">
          <h3 className="text-2xl font-extrabold text-[color:var(--brand-primary)] tracking-tight">{t("forgotTitle")}</h3>
          <p className="mt-2 text-sm text-[color:var(--brand-primary)]/60 leading-relaxed">
            {t("forgotBody")}
          </p>
        </div>
        <button onClick={onClose} className="w-full h-12 rounded-2xl bg-[color:var(--brand-primary)] text-white font-bold hover:bg-[color:var(--brand-primary-strong)] transition-colors">
          {tCommon("done")}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
