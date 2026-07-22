"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  MessageCircle,
  Send,
  Check,
  X,
  Users,
  ChevronRight,
  Sparkles,
  Tag,
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { useTranslations } from "next-intl";

// ---------- Data ----------
type Segment = "vip" | "hot" | "new" | "passive";
type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string;
  segment: Segment;
  lastOrder: string;
  total: number;
};

const CUSTOMERS: Customer[] = [
  { id: "c01", name: "Ayşe Yılmaz",     phone: "+90 532 111 22 33", city: "İstanbul", segment: "vip",     lastOrder: "2 gün önce",  total: 84500 },
  { id: "c02", name: "Mehmet Demir",    phone: "+90 533 222 33 44", city: "Ankara",   segment: "hot",     lastOrder: "1 hafta önce", total: 32400 },
  { id: "c03", name: "Zeynep Kara",     phone: "+90 535 333 44 55", city: "İzmir",    segment: "vip",     lastOrder: "5 gün önce",  total: 124000 },
  { id: "c04", name: "Hasan Çelik",     phone: "+90 537 444 55 66", city: "Bursa",    segment: "new",     lastOrder: "Bugün",       total: 18900 },
  { id: "c05", name: "Elif Aydın",      phone: "+90 538 555 66 77", city: "Antalya",  segment: "passive", lastOrder: "6 ay önce",   total: 8700 },
  { id: "c06", name: "Burak Şahin",     phone: "+90 539 666 77 88", city: "Adana",    segment: "hot",     lastOrder: "3 gün önce",  total: 45600 },
  { id: "c07", name: "Selin Doğan",     phone: "+90 541 777 88 99", city: "İstanbul", segment: "vip",     lastOrder: "1 gün önce",  total: 99800 },
  { id: "c08", name: "Emre Kılıç",      phone: "+90 542 888 99 00", city: "Kocaeli",  segment: "new",     lastOrder: "Dün",         total: 22300 },
  { id: "c09", name: "Fatma Acar",      phone: "+90 543 999 00 11", city: "Gaziantep", segment: "passive", lastOrder: "1 yıl önce", total: 6500 },
  { id: "c10", name: "Mert Polat",      phone: "+90 544 000 11 22", city: "İstanbul", segment: "hot",     lastOrder: "4 gün önce",  total: 36900 },
  { id: "c11", name: "Deniz Aksoy",     phone: "+90 545 111 22 33", city: "İzmir",    segment: "vip",     lastOrder: "1 gün önce",  total: 152000 },
  { id: "c12", name: "Canan Erdoğan",   phone: "+90 546 222 33 44", city: "Ankara",   segment: "new",     lastOrder: "3 gün önce",  total: 14200 },
  { id: "c13", name: "Onur Yıldız",     phone: "+90 547 333 44 55", city: "Konya",    segment: "hot",     lastOrder: "2 hafta önce", total: 28600 },
  { id: "c14", name: "Pınar Güneş",     phone: "+90 548 444 55 66", city: "Eskişehir", segment: "passive", lastOrder: "8 ay önce",  total: 11300 },
];

type TemplateKeyPrefix = "tplNewCollection" | "tplVip" | "tplOrder" | "tplWinback";
type TemplateDef = { id: string; prefix: TemplateKeyPrefix };
const TEMPLATES: TemplateDef[] = [
  { id: "t1", prefix: "tplNewCollection" },
  { id: "t2", prefix: "tplVip" },
  { id: "t3", prefix: "tplOrder" },
  { id: "t4", prefix: "tplWinback" },
];

const SEGMENT_LABEL_KEYS: Record<Segment, "segmentVip" | "segmentHot" | "segmentNew" | "segmentPassive"> = {
  vip: "segmentVip",
  hot: "segmentHot",
  new: "segmentNew",
  passive: "segmentPassive",
};

type SendStatus = "pending" | "sending" | "sent" | "failed";

function WhatsappPage() {
  const t = useTranslations("whatsappSms");
  const tCommon = useTranslations("common");
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState<Segment | "all">("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [sending, setSending] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, SendStatus>>({});
  const [showProgress, setShowProgress] = useState(false);

  const templateDef = TEMPLATES.find(tmpl => tmpl.id === templateId)!;
  const templateName = t(`${templateDef.prefix}Name`);
  const templateSubject = t(`${templateDef.prefix}Subject`);
  const templateBody = t(`${templateDef.prefix}Body`, { ad: "Ayşe" });
  const templateBodyPreview = (prefix: TemplateKeyPrefix) =>
    t(`${prefix}Body`, { ad: "{ad}" });

  const cities = useMemo(() => Array.from(new Set(CUSTOMERS.map(c => c.city))).sort(), []);

  const filtered = useMemo(() => CUSTOMERS.filter(c => {
    if (segmentFilter !== "all" && c.segment !== segmentFilter) return false;
    if (cityFilter !== "all" && c.city !== cityFilter) return false;
    const q = search.toLowerCase();
    if (q && !(c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.city.toLowerCase().includes(q))) return false;
    return true;
  }), [search, segmentFilter, cityFilter]);

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c.id)));
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const beginSend = () => {
    if (selected.size === 0) return;
    setShowProgress(true);
    setSending(true);
    const init: Record<string, SendStatus> = {};
    selected.forEach(id => { init[id] = "pending"; });
    setStatuses(init);
  };

  // Simulate sequential sending
  useEffect(() => {
    if (!sending) return;
    const ids = Array.from(selected);
    let i = 0;
    const tick = () => {
      if (i >= ids.length) {
        setSending(false);
        return;
      }
      const id = ids[i];
      setStatuses(s => ({ ...s, [id]: "sending" }));
      setTimeout(() => {
        setStatuses(s => ({ ...s, [id]: Math.random() > 0.08 ? "sent" : "failed" }));
        i++;
        tick();
      }, 350 + Math.random() * 400);
    };
    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sending]);

  const sentCount = Object.values(statuses).filter(s => s === "sent").length;
  const failedCount = Object.values(statuses).filter(s => s === "failed").length;
  const total = Object.keys(statuses).length;

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      {/* Header */}
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> {tCommon("back")}
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">{t("headerTitle")}</div>
        <div className="flex-1" />
      </header>

      <main className="px-4 lg:px-8 py-6 grid grid-cols-12 gap-4">
        {/* Customer list */}
        <section className="col-span-12 lg:col-span-8 space-y-3">
          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--istikbal-blue)]/40" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="w-full h-10 pl-9 pr-3 rounded-xl bg-black/5 text-sm placeholder:text-[color:var(--istikbal-blue)]/40 text-[color:var(--istikbal-blue)] focus:outline-none focus:ring-2 focus:ring-[color:var(--istikbal-blue)]/20"
                />
              </div>
              <FilterChip
                label={t("filterSegment")}
                value={segmentFilter}
                options={[
                  { v: "all", l: tCommon("all") },
                  { v: "vip", l: t("segmentVip") },
                  { v: "hot", l: t("segmentHot") },
                  { v: "new", l: t("segmentNew") },
                  { v: "passive", l: t("segmentPassive") },
                ]}
                onChange={(v) => setSegmentFilter(v as Segment | "all")}
              />
              <FilterChip
                label={t("filterCity")}
                value={cityFilter}
                options={[{ v: "all", l: tCommon("all") }, ...cities.map(c => ({ v: c, l: c }))]}
                onChange={setCityFilter}
              />
            </div>
          </div>

          {/* Customers */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="size-5 rounded border-2 border-[color:var(--istikbal-blue)]/30 hover:border-[color:var(--istikbal-blue)] flex items-center justify-center"
                >
                  {selected.size > 0 && selected.size === filtered.length && <Check className="size-3.5 text-[color:var(--istikbal-blue)]" />}
                  {selected.size > 0 && selected.size < filtered.length && <span className="size-2 bg-[color:var(--istikbal-blue)] rounded-sm" />}
                </button>
                <span className="text-sm font-semibold text-[color:var(--istikbal-blue)]">
                  {selected.size > 0
                    ? t("selectedCount", { count: selected.size })
                    : t("customerCount", { count: filtered.length })}
                </span>
              </div>
              <Users className="size-4 text-[color:var(--istikbal-blue)]/40" />
            </div>
            <div className="max-h-[640px] overflow-y-auto divide-y divide-black/5">
              {filtered.map(c => {
                const isSel = selected.has(c.id);
                return (
                  <label key={c.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition hover:bg-black/[0.02] ${isSel ? "bg-[color:var(--istikbal-blue)]/[0.04]" : ""}`}>
                    <input type="checkbox" checked={isSel} onChange={() => toggleOne(c.id)} className="size-4 accent-[color:var(--istikbal-blue)]" />
                    <div className="size-10 rounded-full bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-navy)] text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[color:var(--istikbal-blue)] truncate">{c.name}</span>
                        <SegmentBadge s={c.segment} />
                      </div>
                      <div className="text-xs text-[color:var(--istikbal-blue)]/50 truncate">{c.phone} · {c.city}</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-[color:var(--istikbal-blue)]/60 font-semibold">{c.total.toLocaleString("tr-TR")} {tCommon("currencyTl")}</div>
                      <div className="text-[11px] text-[color:var(--istikbal-blue)]/40">{c.lastOrder}</div>
                    </div>
                  </label>
                );
              })}
              {filtered.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-[color:var(--istikbal-blue)]/50">
                  <Filter className="size-6 mx-auto mb-2 opacity-40" />
                  {t("emptyFiltered")}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right panel */}
        <aside className="col-span-12 lg:col-span-4 space-y-3">
          {/* Channel */}
          <div className="bg-white rounded-2xl p-2 flex gap-1 shadow-sm">
            <button
              onClick={() => setChannel("whatsapp")}
              className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${channel === "whatsapp" ? "bg-[#25D366] text-white" : "text-[color:var(--istikbal-blue)] hover:bg-black/5"}`}
            >
              <MessageCircle className="size-4" /> {t("channelWhatsapp")}
            </button>
            <button
              onClick={() => setChannel("sms")}
              className={`flex-1 h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${channel === "sms" ? "bg-[color:var(--istikbal-blue)] text-white" : "text-[color:var(--istikbal-blue)] hover:bg-black/5"}`}
            >
              <Send className="size-4" /> {t("channelSms")}
            </button>
          </div>

          {/* Templates */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider">{t("templateSection")}</h3>
              <button className="text-[11px] font-semibold text-[color:var(--istikbal-blue)] flex items-center gap-1 hover:underline">
                <Sparkles className="size-3" /> {t("createWithAi")}
              </button>
            </div>
            <div className="space-y-2">
              {TEMPLATES.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => setTemplateId(tmpl.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition ${templateId === tmpl.id ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue)]/5" : "border-black/5 hover:border-black/15"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-[color:var(--istikbal-blue)]">{t(`${tmpl.prefix}Name`)}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[color:var(--istikbal-yellow)]/30 text-[color:var(--istikbal-blue)]"><Tag className="size-2.5 inline -mt-0.5" /> {t(`${tmpl.prefix}Tag`)}</span>
                  </div>
                  <p className="text-xs text-[color:var(--istikbal-blue)]/60 line-clamp-2">{templateBodyPreview(tmpl.prefix)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-[11px] font-bold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider mb-3">{t("preview")}</h3>
            <div className={`rounded-2xl p-3 ${channel === "whatsapp" ? "bg-[#dcf8c6]" : "bg-[color:var(--istikbal-blue)]/10"}`}>
              <div className="text-[11px] font-bold text-[color:var(--istikbal-blue)] mb-1">{templateSubject}</div>
              <p className="text-sm text-[color:var(--istikbal-blue)] leading-snug whitespace-pre-line">
                {templateBody}
              </p>
              <div className="text-[10px] text-[color:var(--istikbal-blue)]/50 text-right mt-1">14:32 ✓✓</div>
            </div>
          </div>

          {/* Send */}
          <button
            onClick={beginSend}
            disabled={selected.size === 0 || sending}
            className={`w-full h-14 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition shadow-sm ${
              selected.size === 0
                ? "bg-black/5 text-[color:var(--istikbal-blue)]/40 cursor-not-allowed"
                : channel === "whatsapp"
                  ? "bg-[#25D366] text-white hover:opacity-90"
                  : "bg-[color:var(--istikbal-blue)] text-white hover:opacity-90"
            }`}
          >
            <Send className="size-4" />
            {selected.size === 0 ? t("sendSelectFirst") : t("sendToCount", { count: selected.size })}
            {selected.size > 0 && <ChevronRight className="size-4" />}
          </button>
        </aside>
      </main>

      {/* Progress modal */}
      {showProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-[color:var(--istikbal-blue)]">
                  {sending ? t("progressSending") : t("progressDone")}
                </h3>
                <p className="text-xs text-[color:var(--istikbal-blue)]/60 mt-0.5">
                  {channel === "whatsapp" ? t("channelWhatsapp") : t("channelSms")} · {templateName}
                </p>
              </div>
              {!sending && (
                <button onClick={() => { setShowProgress(false); setStatuses({}); }} className="size-8 rounded-full hover:bg-black/5 flex items-center justify-center text-[color:var(--istikbal-blue)]">
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Stat label={tCommon("total")} value={total} color="text-[color:var(--istikbal-blue)]" />
              <Stat label={tCommon("success")} value={sentCount} color="text-emerald-600" />
              <Stat label={tCommon("failed")} value={failedCount} color="text-rose-600" />
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-black/5 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full transition-all duration-300 ${channel === "whatsapp" ? "bg-[#25D366]" : "bg-[color:var(--istikbal-blue)]"}`}
                style={{ width: `${total ? ((sentCount + failedCount) / total) * 100 : 0}%` }}
              />
            </div>

            {/* Per-recipient list */}
            <div className="max-h-[260px] overflow-y-auto space-y-1 -mr-2 pr-2">
              {Array.from(selected).map(id => {
                const c = CUSTOMERS.find(x => x.id === id)!;
                const s = statuses[id] ?? "pending";
                return (
                  <div key={id} className="flex items-center gap-3 p-2 rounded-lg bg-stone-50">
                    <div className="size-7 rounded-full bg-gradient-to-br from-[color:var(--istikbal-blue)] to-[color:var(--istikbal-navy)] text-white flex items-center justify-center text-[10px] font-bold">
                      {c.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-[color:var(--istikbal-blue)] truncate">{c.name}</div>
                      <div className="text-[10px] text-[color:var(--istikbal-blue)]/50">{c.phone}</div>
                    </div>
                    <StatusPill status={s} />
                  </div>
                );
              })}
            </div>

            {!sending && (
              <button onClick={() => { setShowProgress(false); setStatuses({}); setSelected(new Set()); }} className="mt-4 w-full h-11 rounded-xl bg-[color:var(--istikbal-blue)] text-white font-semibold hover:opacity-90">
                {tCommon("done")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function FilterChip({ label, value, options, onChange }: { label: string; value: string; options: { v: string; l: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 h-10 px-3 rounded-xl bg-black/5 text-sm text-[color:var(--istikbal-blue)]">
      <span className="text-xs font-semibold text-[color:var(--istikbal-blue)]/60">{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function SegmentBadge({ s }: { s: Segment }) {
  const t = useTranslations("whatsappSms");
  const styles: Record<Segment, string> = {
    vip:     "bg-[color:var(--istikbal-yellow)]/30 text-[color:var(--istikbal-blue)]",
    hot:     "bg-orange-100 text-orange-700",
    new:     "bg-emerald-100 text-emerald-700",
    passive: "bg-zinc-200 text-zinc-600",
  };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles[s]}`}>{t(SEGMENT_LABEL_KEYS[s])}</span>;
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3 text-center">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-[10px] font-semibold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: SendStatus }) {
  const tCommon = useTranslations("common");
  if (status === "pending") return <span className="text-[10px] font-semibold text-[color:var(--istikbal-blue)]/40 px-2 py-1 rounded-full bg-white">{tCommon("pending")}</span>;
  if (status === "sending") return <span className="text-[10px] font-semibold text-[color:var(--istikbal-blue)] px-2 py-1 rounded-full bg-[color:var(--istikbal-blue)]/10 flex items-center gap-1"><span className="size-1.5 bg-[color:var(--istikbal-blue)] rounded-full animate-pulse" /> {tCommon("sending")}</span>;
  if (status === "sent") return <span className="text-[10px] font-semibold text-emerald-700 px-2 py-1 rounded-full bg-emerald-50 flex items-center gap-1"><Check className="size-3" /> {tCommon("sent")}</span>;
  return <span className="text-[10px] font-semibold text-rose-700 px-2 py-1 rounded-full bg-rose-50 flex items-center gap-1"><X className="size-3" /> {tCommon("failed")}</span>;
}

export default WhatsappPage;
