"use client";

import Link from "next/link";
import {
  ArrowLeft,
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
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "magaza",       title: "Mağaza Bilgileri",  desc: "Bayi adı, iletişim, adres ve logo", icon: Store },
  { id: "bildirim",     title: "Bildirimler",       desc: "E-posta, push ve sistem uyarıları", icon: Bell },
  { id: "gorunum",      title: "Görünüm",           desc: "Tema, renk vurguları ve yoğunluk",  icon: Palette },
  { id: "dil",          title: "Dil & Bölge",       desc: "Arayüz dili, para birimi, saat",     icon: Languages },
  { id: "guvenlik",     title: "Güvenlik",          desc: "Şifre, 2FA ve oturum yönetimi",      icon: Shield },
  { id: "odeme",        title: "Ödeme & Fatura",    desc: "Plan, kart ve fatura geçmişi",       icon: CreditCard },
  { id: "entegrasyon",  title: "Entegrasyonlar",    desc: "WhatsApp, Meta, Google, ERP",        icon: Plug },
  { id: "veri",         title: "Veri & Yedekleme",  desc: "Dışa aktarma, yedek ve silme",       icon: Database },
];

function AyarlarPage() {
  const [active, setActive] = useState<SectionId>("magaza");

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> Geri
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">AYARLAR</div>
        <div className="flex-1" />
      </header>

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
                        {s.title}
                      </span>
                      <span
                        className={[
                          "block text-[11px] truncate leading-tight mt-0.5",
                          isActive ? "text-white/70" : "text-[color:var(--istikbal-blue)]/55",
                        ].join(" ")}
                      >
                        {s.desc}
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
  const [name, setName] = useState("İstikbal Kadıköy");
  const [email, setEmail] = useState("kadikoy@istikbal.com.tr");
  const [phone, setPhone] = useState("+90 216 555 12 34");
  const [addr, setAddr] = useState("Caferağa Mah. Moda Cad. No:12 Kadıköy / İstanbul");

  return (
    <PanelCard
      title="Mağaza Bilgileri"
      desc="Bayi profilin ve müşterilere görünen iletişim bilgileri."
      action={<PrimaryBtn><Check className="size-4" /> Kaydet</PrimaryBtn>}
    >
      <div className="flex items-center gap-5 pb-6 mb-6 border-b border-black/5">
        <div className="size-20 rounded-2xl bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-blue)]/70 grid place-items-center text-white text-2xl font-black italic">
          i
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">Mağaza Logosu</p>
          <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">
            PNG / SVG · maks 2MB · 1:1 önerilir
          </p>
          <div className="flex gap-2 mt-3">
            <GhostBtn><Upload className="size-4" /> Yükle</GhostBtn>
            <button className="text-xs font-semibold text-[color:var(--istikbal-blue)]/50 hover:text-[color:var(--istikbal-blue)] px-2">
              Kaldır
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Mağaza Adı"   icon={<Building2 className="size-4" />} value={name}  onChange={setName} />
        <Field label="E-posta"      icon={<Mail className="size-4" />}       value={email} onChange={setEmail} type="email" />
        <Field label="Telefon"      icon={<Phone className="size-4" />}      value={phone} onChange={setPhone} />
        <Field label="Adres"        icon={<MapPin className="size-4" />}     value={addr}  onChange={setAddr} />
      </div>
    </PanelCard>
  );
}

function BildirimPanel() {
  const [n, setN] = useState({ email: true, push: true, sms: false, news: true, weekly: false });
  return (
    <PanelCard title="Bildirimler" desc="Hangi olaylar için bildirim almak istediğini seç.">
      <ToggleRow title="E-posta bildirimleri" desc="Sipariş, randevu ve mesaj uyarıları" checked={n.email} onChange={(v) => setN({ ...n, email: v })} />
      <ToggleRow title="Push bildirimleri"    desc="Tarayıcı ve uygulama anlık bildirimleri" checked={n.push} onChange={(v) => setN({ ...n, push: v })} />
      <ToggleRow title="SMS bildirimleri"     desc="Kritik olaylar için SMS gönder"          checked={n.sms} onChange={(v) => setN({ ...n, sms: v })} />
      <ToggleRow title="Ürün haberleri"       desc="Yeni özellikler ve duyurular"             checked={n.news} onChange={(v) => setN({ ...n, news: v })} />
      <ToggleRow title="Haftalık özet"        desc="Pazartesi sabahı performans raporu"        checked={n.weekly} onChange={(v) => setN({ ...n, weekly: v })} />
    </PanelCard>
  );
}

function GorunumPanel() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("light");
  const [density, setDensity] = useState<"compact" | "cozy" | "comfortable">("cozy");
  const accents = ["#1f5fa8", "#0d3b73", "#2da5b8", "#f5b945", "#e85d3a", "#7d57c1"];
  const [accent, setAccent] = useState(accents[0]);

  return (
    <PanelCard title="Görünüm" desc="Tema, vurgu rengi ve arayüz yoğunluğu.">
      <div className="space-y-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">Tema</p>
          <div className="grid grid-cols-3 gap-3">
            {(["light", "dark", "auto"] as const).map((t) => {
              const isActive = theme === t;
              const labels = { light: "Aydınlık", dark: "Karanlık", auto: "Otomatik" };
              return (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
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
                      t === "light" && "bg-white",
                      t === "dark" && "bg-[#0d1424]",
                      t === "auto" && "bg-gradient-to-r from-white via-white to-[#0d1424]",
                    ].filter(Boolean).join(" ")}
                  />
                  <p className="text-xs font-semibold text-[color:var(--istikbal-blue)]">{labels[t]}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">Vurgu Rengi</p>
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
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60 mb-2">Yoğunluk</p>
          <div className="inline-flex bg-[color:var(--istikbal-blue-soft)] rounded-xl p-1">
            {(["compact", "cozy", "comfortable"] as const).map((d) => {
              const labels = { compact: "Sık", cozy: "Dengeli", comfortable: "Geniş" };
              return (
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
                  {labels[d]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </PanelCard>
  );
}

function DilPanel() {
  const [lang, setLang] = useState("tr");
  const [currency, setCurrency] = useState("TRY");
  const [tz, setTz] = useState("Europe/Istanbul");

  return (
    <PanelCard title="Dil & Bölge">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select label="Arayüz Dili" value={lang} onChange={setLang} options={[
          { v: "tr", l: "🇹🇷  Türkçe" },
          { v: "en", l: "🇬🇧  English" },
          { v: "de", l: "🇩🇪  Deutsch" },
          { v: "ar", l: "🇸🇦  العربية" },
        ]} />
        <Select label="Para Birimi" value={currency} onChange={setCurrency} options={[
          { v: "TRY", l: "₺  Türk Lirası" },
          { v: "USD", l: "$  US Dollar" },
          { v: "EUR", l: "€  Euro" },
        ]} />
        <Select label="Saat Dilimi" value={tz} onChange={setTz} options={[
          { v: "Europe/Istanbul", l: "İstanbul (UTC+3)" },
          { v: "Europe/Berlin",   l: "Berlin (UTC+1)" },
          { v: "Europe/London",   l: "London (UTC+0)" },
        ]} />
      </div>
    </PanelCard>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { v: string; l: string }[] }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl bg-[color:var(--istikbal-blue-soft)]/50 border border-transparent text-sm text-[color:var(--istikbal-blue)] px-3.5 py-2.5 outline-none focus:bg-white focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/10"
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function GuvenlikPanel() {
  const [twoFA, setTwoFA] = useState(true);
  const [loginAlerts, setLoginAlerts] = useState(true);
  return (
    <div className="space-y-6">
      <PanelCard title="Şifre" desc="Hesabını korumak için güçlü ve eşsiz bir şifre kullan.">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Mevcut" value="" onChange={() => {}} type="password" placeholder="••••••••" />
          <Field label="Yeni"   value="" onChange={() => {}} type="password" placeholder="••••••••" />
          <Field label="Tekrar" value="" onChange={() => {}} type="password" placeholder="••••••••" />
        </div>
        <div className="mt-4">
          <PrimaryBtn>Şifreyi Güncelle</PrimaryBtn>
        </div>
      </PanelCard>

      <PanelCard title="Çift Faktörlü Doğrulama">
        <ToggleRow title="Authenticator uygulaması" desc="Google Authenticator, Authy ile 6 haneli kod" checked={twoFA} onChange={setTwoFA} />
        <ToggleRow title="Yeni giriş uyarısı"      desc="Tanımadığın bir cihazda giriş olunca e-posta" checked={loginAlerts} onChange={setLoginAlerts} />
      </PanelCard>
    </div>
  );
}

function OdemePanel() {
  return (
    <PanelCard title="Ödeme & Fatura">
      <div className="rounded-2xl bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-blue)]/80 text-white p-5 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/70">Aktif Plan</p>
            <p className="text-2xl font-extrabold mt-1">Pro · Bayi</p>
            <p className="text-xs text-white/70 mt-1">Sıradaki tahsilat: 14 Tem 2026</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-extrabold">₺2.490<span className="text-sm font-medium text-white/70">/ay</span></p>
            <button className="mt-2 text-xs font-semibold underline underline-offset-2">Planı yönet</button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {[
          { date: "14 Haz 2026", n: "INV-2026-006", amt: "₺2.490", st: "Ödendi" },
          { date: "14 May 2026", n: "INV-2026-005", amt: "₺2.490", st: "Ödendi" },
          { date: "14 Nis 2026", n: "INV-2026-004", amt: "₺2.490", st: "Ödendi" },
        ].map((r) => (
          <div key={r.n} className="flex items-center justify-between bg-[color:var(--istikbal-blue-soft)]/40 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">{r.n}</p>
              <p className="text-xs text-[color:var(--istikbal-blue)]/55">{r.date}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{r.st}</span>
              <span className="text-sm font-bold text-[color:var(--istikbal-blue)]">{r.amt}</span>
            </div>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function EntegrasyonPanel() {
  const items = [
    { name: "WhatsApp Business",  desc: "Resmi WhatsApp API",      connected: true },
    { name: "Meta Ads",           desc: "Facebook & Instagram",    connected: true },
    { name: "Google My Business", desc: "Harita ve değerlendirme", connected: false },
    { name: "ERP / Stok",         desc: "İstikbal merkez sistemi", connected: true },
    { name: "Google Analytics",   desc: "Site trafik ölçümü",      connected: false },
  ];
  return (
    <PanelCard title="Entegrasyonlar" desc="Bağlı uygulamaları yönet veya yeni bağlantı ekle.">
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
                {i.connected ? "Bağlı" : "Bağlı değil"}
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
              {i.connected ? "Yönet" : "Bağla"}
            </button>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

function VeriPanel() {
  return (
    <PanelCard title="Veri & Yedekleme">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-2xl bg-[color:var(--istikbal-blue-soft)]/40 p-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">Tüm veriyi dışa aktar</p>
            <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">Müşteri, sipariş ve render verisi (ZIP)</p>
          </div>
          <GhostBtn>İndir</GhostBtn>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-[color:var(--istikbal-blue-soft)]/40 p-4">
          <div>
            <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">Otomatik yedekleme</p>
            <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">Haftalık, bulutta saklanır</p>
          </div>
          <Toggle checked={true} onChange={() => {}} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <div>
            <p className="text-sm font-semibold text-rose-700">Hesabı sil</p>
            <p className="text-xs text-rose-600/80 mt-0.5">Bu işlem geri alınamaz. Tüm veriler 30 gün sonra silinir.</p>
          </div>
          <button className="text-xs font-semibold px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700">
            Hesabı Sil
          </button>
        </div>
      </div>
    </PanelCard>
  );
}

export default AyarlarPage;
