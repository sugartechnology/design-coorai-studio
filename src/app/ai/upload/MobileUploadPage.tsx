"use client";

import { Upload, Check, Image as ImageIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useRef, useState } from "react";

function MobileUploadPageInner() {
  const t = useTranslations("aiUpload");
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("s") ?? "—";
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const onPick = (file?: File) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setSent(false);
  };

  const send = () => {
    // UI-only: backend henüz bağlı değil. Sadece onay göster.
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-[color:var(--brand-bg)] flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-base font-extrabold tracking-[0.14em] text-[color:var(--brand-primary)]">
          {t("title")}
        </h1>
        <p className="mt-2 text-xs text-[color:var(--brand-primary)]/60">
          {t("sessionLabel", { id: sessionId })}
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          className="mt-6 aspect-[4/3] rounded-2xl bg-white border-2 border-dashed border-[color:var(--brand-primary)]/20 flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {preview ? (
            <img src={preview} alt={t("selectedAlt")} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center text-[color:var(--brand-primary)]/40">
              <ImageIcon className="size-10 mb-2" strokeWidth={1.5} />
              <span className="text-xs font-semibold">{t("tapToSelect")}</span>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => onPick(e.target.files?.[0])}
        />

        <div className="mt-5 flex flex-col gap-3">
          <button
            onClick={() => inputRef.current?.click()}
            className="h-12 rounded-full bg-white border border-black/10 text-[color:var(--brand-primary)] text-sm font-bold inline-flex items-center justify-center gap-2"
          >
            <Upload className="size-4" /> {preview ? t("changeImage") : t("chooseImage")}
          </button>

          <button
            disabled={!preview || sent}
            onClick={send}
            className="h-12 rounded-full bg-[color:var(--brand-primary)] text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {sent ? <><Check className="size-4" /> {t("sent")}</> : t("sendToDesktop")}
          </button>

          {sent && (
            <p className="text-center text-xs text-[color:var(--brand-primary)]/60">
              {t("sentHint")}
            </p>
          )}
          <p className="text-center text-[10px] text-[color:var(--brand-primary)]/40 mt-2">
            {t("demoNote")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function MobileUploadPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[color:var(--brand-bg)]" />}>
      <MobileUploadPageInner />
    </Suspense>
  );
}
