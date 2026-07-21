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
} from "lucide-react";

type Step = "code" | "phone" | "pin";

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

function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("code");
  const [dealerCode, setDealerCode] = useState("");
  const [lookup, setLookup] = useState<LookupResult | null>(null);
  const [selectedPhone, setSelectedPhone] = useState<PhoneOption | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);

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
          typeof data.error === "string" ? data.error : "Bayi bulunamadı.",
        );
        return;
      }
      setLookup(data as LookupResult);
      setSelectedPhone(null);
      setSessionId(null);
      setPin("");
      setStep("phone");
    } catch {
      setError("Bayi servisine ulaşılamıyor.");
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
              : "SMS gönderilemedi.",
        );
        return;
      }
      if (!data.sessionId) {
        setError("Oturum oluşturulamadı.");
        return;
      }
      setSessionId(data.sessionId);
      setPin("");
      setStep("pin");
    } catch {
      setError("SMS servisine ulaşılamıyor.");
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
            : "Pin kodu doğrulanamadı.",
        );
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Doğrulama servisine ulaşılamıyor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[color:var(--istikbal-bg)]">
      <aside className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-[color:var(--istikbal-yellow)] via-[#f6c200] to-[#f0a400] text-[color:var(--istikbal-blue)]">
        <div className="flex items-center gap-2">
          <span className="text-4xl leading-none">≋</span>
          <span className="text-3xl font-extrabold italic tracking-tight">istikbal</span>
        </div>

        <div className="pointer-events-none absolute -left-32 -bottom-32 w-[520px] h-[520px] rounded-full bg-white/70 blur-[2px]" />
        <div className="pointer-events-none absolute right-10 top-32 w-40 h-40 rounded-full bg-white/30" />
        <div className="pointer-events-none absolute right-32 bottom-40 w-24 h-24 rounded-full bg-[color:var(--istikbal-blue)]/15" />

        <div className="relative z-10 max-w-md">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Bayi Paneline<br />Hoş Geldiniz
          </h1>
          <p className="mt-5 text-lg text-[color:var(--istikbal-blue)]/70 leading-relaxed">
            Bayi kodunuzla giriş yapın, mağazadaki yetkili telefona gelen SMS pin
            kodunu girerek panele erişin.
          </p>
          <div className="mt-10 flex items-center gap-6 text-sm font-medium text-[color:var(--istikbal-blue)]/70">
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> Bayi kodu</span>
            <span className="flex items-center gap-2"><CheckCircle2 className="size-4" /> SMS pin</span>
            <span className="flex items-center gap-2"><ShieldCheck className="size-4" /> Güvenli</span>
          </div>
        </div>

        <p className="relative z-10 text-xs text-[color:var(--istikbal-blue)]/60">
          © {new Date().getFullYear()} İstikbal · 3D Tasarım Stüdyosu
        </p>
      </aside>

      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="text-[color:var(--istikbal-yellow)] text-3xl leading-none">≋</span>
            <span className="text-2xl font-extrabold italic text-[color:var(--istikbal-blue)] tracking-tight">istikbal</span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">Giriş Yap</h2>
            <p className="mt-2 text-[color:var(--istikbal-blue)]/60">
              {step === "code" && "Bayi kodunuzla başlayın."}
              {step === "phone" && lookup?.status === "NEEDS_PROVISION" &&
                "Bayi kaydı için admin telefonunu seçin."}
              {step === "phone" && lookup?.status === "READY" &&
                "SMS pin kodunun gönderileceği numarayı seçin."}
              {step === "pin" && "Telefona gelen 6 haneli SMS pin kodunu girin."}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {(["code", "phone", "pin"] as const).map((s, i) => {
              const active = step === s;
              const done = ["code", "phone", "pin"].indexOf(step) > i;
              return (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div
                    className={`size-7 rounded-full grid place-items-center text-xs font-bold transition-all ${
                      done
                        ? "bg-[color:var(--istikbal-blue)] text-white"
                        : active
                        ? "bg-[color:var(--istikbal-yellow)] text-[color:var(--istikbal-blue)]"
                        : "bg-[color:var(--istikbal-blue)]/10 text-[color:var(--istikbal-blue)]/50"
                    }`}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : i + 1}
                  </div>
                  {i < 2 && <div className={`flex-1 h-0.5 ${done ? "bg-[color:var(--istikbal-blue)]" : "bg-[color:var(--istikbal-blue)]/10"}`} />}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          )}

          {step === "code" && (
            <form onSubmit={submitCode} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[color:var(--istikbal-blue)] mb-1.5">
                  Bayi Kodu
                </label>
                <div className="relative">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--istikbal-blue)]/40" />
                  <input
                    autoFocus
                    type="text"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    maxLength={13}
                    placeholder="120________"
                    className="w-full pl-11 pr-4 h-13 rounded-2xl bg-[color:var(--istikbal-blue)]/5 border border-transparent focus:bg-white focus:border-[color:var(--istikbal-blue)]/20 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/35 transition-all tracking-wider font-semibold"
                  />
                </div>
                <p className="mt-1.5 text-xs text-[color:var(--istikbal-blue)]/50">
                  Bayi kodları 120 ile başlar · Örn: 1201001 · 1203209033
                </p>
              </div>

              <div className="flex gap-2.5 p-3.5 rounded-2xl bg-[color:var(--istikbal-yellow)]/25 border border-[color:var(--istikbal-yellow)]/40">
                <Info className="size-4.5 shrink-0 text-[color:var(--istikbal-blue)] mt-0.5" />
                <p className="text-xs leading-relaxed text-[color:var(--istikbal-blue)]/80">
                  <b>Şifre geçerlilik süresi 6 aydır.</b> Güvenliğiniz için her 6 ayda
                  bir bayi şifresi otomatik olarak yenilenir. Süresi dolduğunda giriş
                  sırasında yeni şifre belirlemeniz istenir.
                </p>
              </div>

              <button
                type="submit"
                disabled={busy || !dealerCode.trim()}
                className="group w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] active:scale-[0.99] shadow-lg shadow-[color:var(--istikbal-blue)]/25 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>DEVAM ET <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </button>

              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="w-full text-sm font-semibold text-[color:var(--istikbal-blue)]/70 hover:text-[color:var(--istikbal-blue)] hover:underline"
              >
                Şifremi unuttum
              </button>
            </form>
          )}

          {step === "phone" && lookup && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[color:var(--istikbal-blue)]/5">
                <p className="text-xs font-semibold text-[color:var(--istikbal-blue)]/60 uppercase tracking-wider">Bayi</p>
                <p className="mt-0.5 font-bold text-[color:var(--istikbal-blue)]">{lookup.dealerName}</p>
              </div>

              <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">
                SMS pin kodu hangi numaraya gönderilsin?
              </p>

              <div className="space-y-2">
                {lookup.phones.map((p) => (
                  <button
                    key={p.phoneId}
                    type="button"
                    disabled={busy}
                    onClick={() => chooseAndSend(p)}
                    className="w-full text-left p-4 rounded-2xl border-2 border-[color:var(--istikbal-blue)]/10 hover:border-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/5 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <div className="size-10 rounded-xl bg-[color:var(--istikbal-yellow)]/30 grid place-items-center shrink-0">
                      <Phone className="size-4.5 text-[color:var(--istikbal-blue)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[color:var(--istikbal-blue)] text-sm truncate">{p.label}</p>
                      <p className="text-xs text-[color:var(--istikbal-blue)]/60 mt-0.5 tracking-wider">{p.maskedNumber}</p>
                    </div>
                    {busy && selectedPhone?.phoneId === p.phoneId ? (
                      <Loader2 className="size-4 animate-spin text-[color:var(--istikbal-blue)]" />
                    ) : (
                      <ArrowRight className="size-4 text-[color:var(--istikbal-blue)]/40" />
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
                className="flex items-center gap-1 text-sm font-semibold text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"
              >
                <ChevronLeft className="size-4" /> Bayi kodunu değiştir
              </button>
            </div>
          )}

          {step === "pin" && selectedPhone && (
            <form onSubmit={submitPin} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[color:var(--istikbal-yellow)]/25 border border-[color:var(--istikbal-yellow)]/40 flex gap-2.5">
                <CheckCircle2 className="size-4.5 shrink-0 text-[color:var(--istikbal-blue)] mt-0.5" />
                <p className="text-xs leading-relaxed text-[color:var(--istikbal-blue)]/80">
                  <b>{selectedPhone.maskedNumber}</b> numarasına 6 haneli SMS pin kodu gönderildi.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[color:var(--istikbal-blue)] mb-1.5">
                  SMS Pin Kodu
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--istikbal-blue)]/40" />
                  <input
                    autoFocus
                    inputMode="numeric"
                    maxLength={6}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    placeholder="• • • • • •"
                    className="w-full pl-11 pr-4 h-14 rounded-2xl bg-[color:var(--istikbal-blue)]/5 border border-transparent focus:bg-white focus:border-[color:var(--istikbal-blue)]/20 focus:ring-4 focus:ring-[color:var(--istikbal-yellow)]/30 outline-none text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/35 transition-all text-center text-2xl font-bold tracking-[0.5em]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={busy || pin.length < 4}
                className="group w-full h-13 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--istikbal-navy)] active:scale-[0.99] shadow-lg shadow-[color:var(--istikbal-blue)]/25 transition-all disabled:opacity-60"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <>GİRİŞ YAP <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" /></>}
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setError(null);
                  }}
                  className="flex items-center gap-1 font-semibold text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]"
                >
                  <ChevronLeft className="size-4" /> Numarayı değiştir
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => selectedPhone && chooseAndSend(selectedPhone)}
                  className="font-semibold text-[color:var(--istikbal-blue)]/70 hover:text-[color:var(--istikbal-blue)] hover:underline disabled:opacity-50"
                >
                  Tekrar gönder
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-7 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute left-4 top-4 flex items-center gap-1 text-sm text-[color:var(--istikbal-blue)]/60 hover:text-[color:var(--istikbal-blue)]">
          <ChevronLeft className="size-4" /> Kapat
        </button>
        <div className="mt-6 mb-5">
          <h3 className="text-2xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">Şifremi Unuttum</h3>
          <p className="mt-2 text-sm text-[color:var(--istikbal-blue)]/60 leading-relaxed">
            Bu portal SMS pin ile giriş yapar. Bayi kodunuz ve kayıtlı telefonunuzla
            giriş adımlarını tekrar deneyin. Hesap yardımına ihtiyacınız varsa
            destek ekibiyle iletişime geçin.
          </p>
        </div>
        <button onClick={onClose} className="w-full h-12 rounded-2xl bg-[color:var(--istikbal-blue)] text-white font-bold hover:bg-[color:var(--istikbal-navy)] transition-colors">
          Tamam
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
