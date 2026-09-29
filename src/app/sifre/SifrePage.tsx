"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/BrandLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

const MIN_PASSWORD_LENGTH = 4;
const MAX_PASSWORD_LENGTH = 128;
const MAX_PASSWORD_BYTES = 72;

function messageFromBody(data: unknown, fallback: string) {
  if (!data || typeof data !== "object") return fallback;
  const body = data as { message?: unknown; error?: unknown };
  if (typeof body.message === "string" && body.message.trim()) return body.message.trim();
  if (
    typeof body.error === "string" &&
    body.error.trim() &&
    body.error !== "Bad Request" &&
    body.error !== "SESSION_EXPIRED"
  ) {
    return body.error.trim();
  }
  return fallback;
}

export default function SifrePage() {
  const t = useTranslations("login");
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (newPassword !== confirmNewPassword) {
      setError(t("forcePasswordMismatch"));
      return;
    }
    const byteLength = new TextEncoder().encode(newPassword).length;
    if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH ||
      byteLength > MAX_PASSWORD_BYTES
    ) {
      setError(t("forcePasswordLength"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/user/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          router.replace("/login");
          router.refresh();
          return;
        }
        setError(messageFromBody(data, t("forcePasswordError")));
        return;
      }

      await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
      router.replace("/login?passwordChanged=1");
      router.refresh();
    } catch {
      setError(t("forcePasswordUnreachable"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[color:var(--brand-bg)] p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between gap-3">
          <BrandLogo className="h-8" />
          <LocaleSwitcher />
        </div>
        <h1 className="text-3xl font-extrabold text-[color:var(--brand-primary)] tracking-tight">
          {t("forcePasswordTitle")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--brand-primary)]/60">
          {t("forcePasswordBody")}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {error ? (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <PasswordField
            label={t("forcePasswordCurrent")}
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
          />
          <PasswordField
            label={t("forcePasswordNew")}
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
          />
          <PasswordField
            label={t("forcePasswordConfirm")}
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={setConfirmNewPassword}
          />

          <button
            type="submit"
            disabled={
              busy || !currentPassword || !newPassword || !confirmNewPassword
            }
            className="group w-full h-13 rounded-2xl bg-[color:var(--brand-primary)] text-white font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-[color:var(--brand-primary-strong)] active:scale-[0.99] shadow-lg shadow-[color:var(--brand-primary)]/25 transition-all disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {t("forcePasswordSubmit")}{" "}
                <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[color:var(--brand-primary)] mb-1.5">
        {label}
      </label>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 size-4.5 text-[color:var(--brand-primary)]/40" />
        <input
          type="password"
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full pl-11 pr-4 h-13 rounded-2xl bg-[color:var(--brand-primary)]/5 border border-transparent focus:bg-white focus:border-[color:var(--brand-primary)]/20 focus:ring-4 focus:ring-[color:var(--brand-accent)]/30 outline-none text-[color:var(--brand-primary)] placeholder:text-[color:var(--brand-primary)]/35 transition-all font-semibold"
        />
      </div>
    </div>
  );
}
