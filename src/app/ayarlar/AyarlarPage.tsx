"use client";

import {
  Store,
  Bell,
  Palette,
  Languages,
  Shield,
  CreditCard,
  Plug,
  Database,
  ChevronRight,
  Check,
  Building2,
  Mail,
  Phone,
  MapPin,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AppHeader } from "@/components/AppHeader";
import { useSetLocale } from "@/i18n/locale-client";
import { isAppLocale } from "@/i18n/config";

type SectionId =
  | "magaza"
  | "bildirim"
  | "gorunum"
  | "dil"
  | "guvenlik"
  | "odeme"
  | "entegrasyon"
  | "veri";

const SECTIONS: {
  id: SectionId;
  titleKey:
    | "navStoreTitle"
    | "navNotificationsTitle"
    | "navAppearanceTitle"
    | "navLocaleTitle"
    | "navSecurityTitle"
    | "navBillingTitle"
    | "navIntegrationsTitle"
    | "navDataTitle";
  descKey:
    | "navStoreDesc"
    | "navNotificationsDesc"
    | "navAppearanceDesc"
    | "navLocaleDesc"
    | "navSecurityDesc"
    | "navBillingDesc"
    | "navIntegrationsDesc"
    | "navDataDesc";
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "magaza", titleKey: "navStoreTitle", descKey: "navStoreDesc", icon: Store },
  { id: "bildirim", titleKey: "navNotificationsTitle", descKey: "navNotificationsDesc", icon: Bell },
  { id: "gorunum", titleKey: "navAppearanceTitle", descKey: "navAppearanceDesc", icon: Palette },
  { id: "dil", titleKey: "navLocaleTitle", descKey: "navLocaleDesc", icon: Languages },
  { id: "guvenlik", titleKey: "navSecurityTitle", descKey: "navSecurityDesc", icon: Shield },
  { id: "odeme", titleKey: "navBillingTitle", descKey: "navBillingDesc", icon: CreditCard },
  { id: "entegrasyon", titleKey: "navIntegrationsTitle", descKey: "navIntegrationsDesc", icon: Plug },
  { id: "veri", titleKey: "navDataTitle", descKey: "navDataDesc", icon: Database },
];

function AyarlarPage() {
  const t = useTranslations("ayarlar");
  const [active, setActive] = useState<SectionId>("magaza");

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      <AppHeader title={t("headerTitle")} backHref="/" sticky />

      <div className="grid grid-cols-12 gap-6 px-4 md:px-8 py-8">
        {/* Sidebar nav */}
        <aside className="col-span-12 md:col-span-4 lg:col-span-3">
          <div className="rounded-3xl bg-white border border-black/5 p-2 shadow-sm sticky top-6">
            <nav className="flex flex-col gap-0.5">
              {SECTIONS.map((s) => {
                const isActive = active === s.id;
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={[
                      "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all",
                      isActive
                        ? "bg-[color:var(--istikbal-blue)] text-white shadow-sm"
                        : "text-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue-soft)]",
                    ].join(" ")}
                  >
                    <span
                      className={[
                        "flex items-center justify-center size-8 rounded-xl",
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] group-hover:bg-white",
                      ].join(" ")}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold leading-tight truncate">
                        {t(s.titleKey)}
                      </span>
                      <span
                        className={[
                          "block text-[11px] truncate leading-tight mt-0.5",
                          isActive ? "text-white/70" : "text-[color:var(--istikbal-blue)]/55",
                        ].join(" ")}
                      >
                        {t(s.descKey)}
                      </span>
                    </span>
                    <ChevronRight
                      className={[
                        "size-4 shrink-0 transition-transform",
                        isActive ? "text-white translate-x-0.5" : "text-[color:var(--istikbal-blue)]/30",
                      ].join(" ")}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="col-span-12 md:col-span-8 lg:col-span-9">
          {active === "magaza" && <MagazaPanel />}
          {active === "bildirim" && <BildirimPanel />}
          {active === "gorunum" && <GorunumPanel />}
          {active === "dil" && <DilPanel />}
          {active === "guvenlik" && <GuvenlikPanel />}
          {active === "odeme" && <OdemePanel />}
          {active === "entegrasyon" && <EntegrasyonPanel />}
          {active === "veri" && <VeriPanel />}
        </main>
      </div>
    </div>
  );
}

/* ---------- Reusable panel shells ---------- */

function PanelCard({
  title,
  desc,
  children,
  action,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white border border-black/5 shadow-sm overflow-hidden">
      <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-black/5">
        <div>
          <h2 className="text-base font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            {title}
          </h2>
          {desc && (
            <p className="text-xs text-[color:var(--istikbal-blue)]/60 mt-1">{desc}</p>
          )}
        </div>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">
        {label}
      </span>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={[
            "w-full rounded-xl bg-[color:var(--istikbal-blue-soft)]/50 border border-transparent",
            "text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/35",
            "px-3.5 py-2.5 outline-none focus:bg-white focus:border-[color:var(--istikbal-blue)]/30",
            "focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/10 transition",
            icon ? "pl-10" : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        checked
          ? "bg-[color:var(--istikbal-blue)]"
          : "bg-[color:var(--istikbal-blue-soft)] border border-[color:var(--istikbal-blue)]/15",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block size-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}

function ToggleRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-black/5 last:border-0">
      <div>
        <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{title}</p>
        <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function PrimaryBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/90 text-white text-sm font-semibold px-4 py-2.5 transition shadow-sm"
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--istikbal-blue-soft)] hover:bg-[color:var(--istikbal-blue)]/15 text-[color:var(--istikbal-blue)] text-sm font-semibold px-4 py-2.5 transition"
    >
      {children}
    </button>
  );
}

/* ---------- Panels ---------- */

function MagazaPanel() {
  const t = useTranslations("ayarlar");
  const tCommon = useTranslations("common");
  const [name, setName] = useState("İstikbal Kadıköy");
  const [email, setEmail] = useState("kadikoy@istikbal.com.tr");
  const [phone, setPhone] = useState("+90 216 555 12 34");
  const [addr, setAddr] = useState("Caferağa Mah. Moda Cad. No:12 Kadıköy / İstanbul");

  return (
    <PanelCard
      title={t("storeTitle")}
      desc={t("storeDesc")}
      action={<PrimaryBtn><Check className="size-4" /> {tCommon("save")}</PrimaryBtn>}
    >
      <div className="flex items-center gap-5 pb-6 mb-6 border-b border-black/5">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-blue)]/70 grid place-items-center text-white text-2xl font-black italic">
          i
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{t("storeLogo")}</p>
          <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">
            {t("storeLogoHint")}
          </p>
          <div className="flex gap-2 mt-3">
            <GhostBtn><Upload className="size-4" /> {tCommon("upload")}</GhostBtn>
            <button className="text-xs font-semibold text-[color:var(--istikbal-blue)]/50 hover:text-[color:var(--istikbal-blue)] px-2">
              {tCommon("remove")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={t("storeName")} icon={<Building2 className="size-4" />} value={name} onChange={setName} />
        <Field label={t("storeEmail")} icon={<Mail className="size-4" />} value={email} onChange={setEmail} type="email" />
        <Field label={t("storePhone")} icon={<Phone className="size-4" />} value={phone} onChange={setPhone} />
        <Field label={t("storeAddress")} icon={<MapPin className="size-4" />} value={addr} onChange={setAddr} />
      </div>
    </PanelCard>
  );
}

function BildirimPanel() {
  const t = useTranslations("ayarlar");
  const [n, setN] = useState({ email: true, push: true, sms: false, news: true, weekly: false });
  return (
    <PanelCard title={t("notificationsTitle")} desc={t("notificationsDesc")}>
      <ToggleRow title={t("notifEmailTitle")} desc={t("notifEmailDesc")} checked={n.email} onChange={(v) => setN({ ...n, email: v })} />
      <ToggleRow title={t("notifPushTitle")} desc={t("notifPushDesc")} checked={n.push} onChange={(v) => setN({ ...n, push: v })} />
      <ToggleRow title={t("notifSmsTitle")} desc={t("notifSmsDesc")} checked={n.sms} onChange={(v) => setN({ ...n, sms: v })} />
      <ToggleRow title={t("notifNewsTitle")} desc={t("notifNewsDesc")} checked={n.news} onChange={(v) => setN({ ...n, news: v })} />
      <ToggleRow title={t("notifWeeklyTitle")} desc={t("notifWeeklyDesc")} checked={n.weekly} onChange={(v) => setN({ ...n, weekly: v })} />
    </PanelCard>
  );
}

function GorunumPanel() {
  const t = useTranslations("ayarlar");
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [density, setDensity] = useState<"compact" | "cozy" | "comfortable">("cozy");
  const accents = ["#1f5fa8", "#0d3b73", "#2da5b8", "#f5b945", "#e85d3a", "#7d57c1"];
  const [accent, setAccent] = useState(accents[0]);

  const themeLabels = { light: t("themeLight"), dark: t("themeDark"), auto: t("themeAuto") } as const;
  const densityLabels = {
    compact: t("densityCompact"),
    cozy: t("densityCozy"),
    comfortable: t("densityComfortable"),
  } as const;

  return (
    <PanelCard title={t("appearanceTitle")} desc={t("appearanceDesc")}>
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">{t("themeLabel")}</p>
          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "auto"] as const).map((th) => {
              const isActive = theme === th;
              return (
                <button
                  key={th}
                  onClick={() => setTheme(th)}
                  className={[
                    "rounded-2xl p-3 border-2 transition text-left",
                    isActive
                      ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue-soft)]"
                      : "border-transparent bg-[color:var(--istikbal-blue-soft)]/50 hover:bg-[color:var(--istikbal-blue-soft)]",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "h-14 rounded-lg mb-2 border border-black/5",
                      th === "light" && "bg-white",
                      th === "dark" && "bg-[#0d1424]",
                      th === "auto" && "bg-gradient-to-r from-white via-white to-[#0d1424]",
                    ].filter(Boolean).join(" ")}
                  />
                  <p className="text-xs font-semibold text-[color:var(--istikbal-blue)]">{themeLabels[th]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">{t("accentLabel")}</p>
          <div className="flex flex-wrap gap-2">
            {accents.map((c) => (
              <button
                key={c}
                onClick={() => setAccent(c)}
                style={{ background: c }}
                className={[
                  "size-9 rounded-xl transition relative",
                  accent === c ? "ring-2 ring-offset-2 ring-[color:var(--istikbal-blue)]" : "hover:scale-110",
                ].join(" ")}
              >
                {accent === c && <Check className="size-4 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">{t("densityLabel")}</p>
          <div className="inline-flex bg-[color:var(--istikbal-blue-soft)] rounded-xl p-1">
            {(["compact", "cozy", "comfortable"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={[
                  "px-4 py-1.5 rounded-lg text-xs font-semibold transition",
                  density === d
                    ? "bg-white text-[color:var(--istikbal-blue)] shadow-sm"
                    : "text-[color:var(--istikbal-blue)]/60",
                ].join(" ")}
              >
                {densityLabels[d]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function DilPanel() {
  const t = useTranslations("ayarlar");
  const locale = useLocale();
  const { setLocale, pending } = useSetLocale();
  const [currency, setCurrency] = useState("TRY");
  const [tz, setTz] = useState("Europe/Istanbul");

  return (
    <PanelCard title={t("localeTitle")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label={t("uiLanguage")}
          value={locale}
          disabled={pending}
          onChange={(v) => {
            if (isAppLocale(v)) setLocale(v);
          }}
          options={[
            { v: "tr", l: `🇹🇷  ${t("langTr")}` },
            { v: "en", l: `🇬🇧  ${t("langEn")}` },
            { v: "de", l: `🇩🇪  ${t("langDe")}`, disabled: true },
            { v: "ar", l: `🇸🇦  ${t("langAr")}`, disabled: true },
          ]}
        />
        <Select
          label={t("currency")}
          value={currency}
          onChange={setCurrency}
          options={[
            { v: "TRY", l: t("currencyTry") },
            { v: "USD", l: t("currencyUsd") },
            { v: "EUR", l: t("currencyEur") },
          ]}
        />
        <Select
          label={t("timezone")}
          value={tz}
          onChange={setTz}
          options={[
            { v: "Europe/Istanbul", l: t("tzIstanbul") },
            { v: "Europe/Berlin", l: t("tzBerlin") },
            { v: "Europe/London", l: t("tzLondon") },
          ]}
        />
      </div>
    </PanelCard>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string; disabled?: boolean }[];
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">{label}</span>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-[color:var(--istikbal-blue-soft)]/50 border border-transparent text-sm text-[color:var(--istikbal-blue)] px-3.5 py-2.5 outline-none focus:bg-white focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/10 disabled:opacity-60"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v} disabled={o.disabled}>
            {o.l}
          </option>
        ))}
      </select>
    </label>
  );
}

function GuvenlikPanel() {
  const t = useTranslations("ayarlar");
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  return (
    <div className="space-y-6">
      <PanelCard title={t("passwordTitle")} desc={t("passwordDesc")}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label={t("passwordCurrent")} value="" onChange={() => {}} type="password" placeholder={t("passwordPlaceholder")} />
          <Field label={t("passwordNew")} value="" onChange={() => {}} type="password" placeholder={t("passwordPlaceholder")} />
          <Field label={t("passwordConfirm")} value="" onChange={() => {}} type="password" placeholder={t("passwordPlaceholder")} />
        </div>
        <div className="mt-4">
          <PrimaryBtn>{t("updatePassword")}</PrimaryBtn>
        </div>
      </PanelCard>

      <PanelCard title={t("twoFaTitle")}>
        <ToggleRow title={t("twoFaAuthAppTitle")} desc={t("twoFaAuthAppDesc")} checked={twoFA} onChange={setTwoFA} />
        <ToggleRow title={t("loginAlertTitle")} desc={t("loginAlertDesc")} checked={loginAlerts} onChange={setLoginAlerts} />
      </PanelCard>
    </div>
  );
}

function OdemePanel() {
  const t = useTranslations("ayarlar");
  return (
    <PanelCard title={t("billingTitle")}>
      <div className="rounded-2xl bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-blue)]/80 text-white p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/70">{t("activePlan")}</p>
            <p className="text-2xl font-extrabold mt-1">{t("planProDealer")}</p>
            <p className="text-xs text-white/70 mt-1">{t("nextCharge", { date: "14 Tem 2026" })}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold">₺2.490<span className="text-sm font-medium text-white/70">{t("perMonth")}</span></p>
            <button className="mt-2 text-xs font-semibold underline underline-offset-2">{t("managePlan")}</button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { date: "14 Haz 2026", n: "INV-2026-006", amt: "₺2.490" },
          { date: "14 May 2026", n: "INV-2026-005", amt: "₺2.490" },
          { date: "14 Nis 2026", n: "INV-2026-004", amt: "₺2.490" },
        ].map((r) => (
          <div key={r.n} className="flex items-center justify-between bg-[color:var(--istikbal-blue-soft)]/40 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{r.n}</p>
              <p className="text-xs text-[color:var(--istikbal-blue)]/55">{r.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{t("invoicePaid")}</span>
              <span className="text-sm font-bold text-[color:var(--istikbal-blue)]">{r.amt}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function EntegrasyonPanel() {
  const t = useTranslations("ayarlar");
  const tCommon = useTranslations("common");
  const items = [
    { name: t("integWhatsappName"), desc: t("integWhatsappDesc"), connected: true },
    { name: t("integMetaAdsName"), desc: t("integMetaAdsDesc"), connected: true },
    { name: t("integGmbName"), desc: t("integGmbDesc"), connected: false },
    { name: t("integErpName"), desc: t("integErpDesc"), connected: true },
    { name: t("integGaName"), desc: t("integGaDesc"), connected: false },
  ];
  return (
    <PanelCard title={t("integrationsTitle")} desc={t("integrationsDesc")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((i) => (
          <div key={i.name} className="rounded-2xl border border-black/5 bg-[color:var(--istikbal-blue-soft)]/40 p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[color:var(--istikbal-blue)]">{i.name}</p>
              <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{i.desc}</p>
              <span
                className={[
                  "inline-block mt-2 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  i.connected ? "bg-emerald-100 text-emerald-700" : "bg-[color:var(--istikbal-blue)]/10 text-[color:var(--istikbal-blue)]/60",
                ].join(" ")}
              >
                {i.connected ? tCommon("connected") : tCommon("notConnected")}
              </span>
            </div>
            <button
              className={[
                "text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0",
                i.connected
                  ? "bg-white text-[color:var(--istikbal-blue)] border border-[color:var(--istikbal-blue)]/15 hover:bg-[color:var(--istikbal-blue-soft)]"
                  : "bg-[color:var(--istikbal-blue)] text-white hover:opacity-90",
              ].join(" ")}
            >
              {i.connected ? tCommon("manage") : tCommon("connect")}
            </button>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function VeriPanel() {
  const t = useTranslations("ayarlar");
  const tCommon = useTranslations("common");
  return (
    <PanelCard title={t("dataTitle")}>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-[color:var(--istikbal-blue-soft)]/40 p-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{t("exportAllTitle")}</p>
            <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{t("exportAllDesc")}</p>
          </div>
          <GhostBtn>{tCommon("download")}</GhostBtn>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-[color:var(--istikbal-blue-soft)]/40 p-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{t("autoBackupTitle")}</p>
            <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{t("autoBackupDesc")}</p>
          </div>
          <Toggle checked={true} onChange={() => {}} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div>
            <p className="text-sm font-semibold text-rose-700">{t("deleteAccountTitle")}</p>
            <p className="text-xs text-rose-600/80 mt-0.5">{t("deleteAccountDesc")}</p>
          </div>
          <button className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">
            {t("deleteAccountAction")}
          </button>
        </div>
      </div>
    </PanelCard>
  );
}

export default AyarlarPage;
