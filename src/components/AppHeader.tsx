"use client";

import Link from "next/link";
import { ArrowLeft, Bell, FileText, ShoppingBag, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import {
  forwardRef,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import {
  getPortalSessionView,
  type PortalSessionView,
} from "@/lib/portal-crm";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCart } from "@/lib/cart";
import { QuoteOfferSheet } from "@/components/offers/QuoteOfferSheet";
import type { QuoteDraft } from "@/lib/offers";
import { defaultLocale, isAppLocale } from "@/i18n/config";

type AppHeaderProps = {
  title: string;
  backHref: string;
  /** Defaults: "/" → common.home, otherwise common.back */
  backLabel?: string;
  actions?: ReactNode;
  sticky?: boolean;
};

const HeaderIconButton = forwardRef<
  HTMLButtonElement,
  {
    label: string;
    count?: number;
    children: ReactNode;
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function HeaderIconButton({ label, count, children, ...props }, ref) {
  const showBadge = typeof count === "number" && count > 0;
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className="relative size-9 rounded-full border border-[color:var(--istikbal-blue)]/10 text-[color:var(--istikbal-blue)] grid place-items-center hover:bg-[color:var(--istikbal-blue)]/5 transition-colors"
      {...props}
    >
      {children}
      {showBadge ? (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[color:var(--istikbal-yellow)] text-[10px] font-bold text-[color:var(--istikbal-blue)] grid place-items-center leading-none">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </button>
  );
});

function HeaderPanelShell({
  title,
  emptyTitle,
  emptyHint,
  icon,
}: {
  title: string;
  emptyTitle: string;
  emptyHint: string;
  icon: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[color:var(--istikbal-blue)]">
          {title}
        </h3>
      </div>
      <div className="rounded-2xl border border-dashed border-[color:var(--istikbal-blue)]/15 bg-[color:var(--istikbal-bg)] px-4 py-8 text-center">
        <div className="mx-auto mb-3 size-10 rounded-full bg-[color:var(--istikbal-blue)]/5 text-[color:var(--istikbal-blue)]/50 grid place-items-center">
          {icon}
        </div>
        <p className="text-sm font-semibold text-[color:var(--istikbal-blue)]">
          {emptyTitle}
        </p>
        <p className="mt-1 text-xs text-[color:var(--istikbal-blue)]/55 leading-relaxed">
          {emptyHint}
        </p>
      </div>
    </div>
  );
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "TRY",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function HeaderCartBox() {
  const t = useTranslations("common");
  const locale = useLocale();
  const language = isAppLocale(locale) ? locale : defaultLocale;
  const { lines, count, removeLine, clear, toQuoteDraft } = useCart();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [draft, setDraft] = useState<QuoteDraft | null>(null);

  const openQuote = () => {
    const next = toQuoteDraft(language);
    if (!next) return;
    setDraft(next);
    setQuoteOpen(true);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <HeaderIconButton label={t("cartTitle")} count={count}>
            <ShoppingBag className="size-4" />
          </HeaderIconButton>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-80 rounded-2xl border border-black/5 bg-white p-4 shadow-lg"
        >
          {lines.length === 0 ? (
            <HeaderPanelShell
              title={t("cartTitle")}
              emptyTitle={t("cartEmpty")}
              emptyHint={t("cartEmptyHint")}
              icon={<ShoppingBag className="size-4" />}
            />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[color:var(--istikbal-blue)]">
                  {t("cartTitle")}
                </h3>
                <span className="text-[10px] font-bold tracking-wide text-[color:var(--istikbal-blue)]/45">
                  {count}
                </span>
              </div>
              <ul className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
                {lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start gap-2 rounded-xl bg-[color:var(--istikbal-bg)] px-2.5 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-[color:var(--istikbal-blue)]">
                        {line.name}
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-[color:var(--istikbal-blue)]/55">
                        ×{line.quantity} ·{" "}
                        {formatMoney(line.price * line.quantity, line.currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={t("cartRemove")}
                      onClick={() => removeLine(line.id)}
                      className="size-7 shrink-0 grid place-items-center rounded-lg text-[color:var(--istikbal-blue)]/40 hover:bg-white hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={openQuote}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[color:var(--istikbal-blue)] text-xs font-bold text-white hover:bg-[color:var(--istikbal-navy)]"
              >
                <FileText className="size-3.5" />
                {t("cartCreateQuote")}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      <QuoteOfferSheet
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        draft={draft}
        onDraftChange={setDraft}
        onCreated={() => clear()}
      />
    </>
  );
}

function HeaderNotificationsBox() {
  const t = useTranslations("common");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <HeaderIconButton label={t("notificationsTitle")}>
          <Bell className="size-4" />
        </HeaderIconButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl border border-black/5 bg-white p-4 shadow-lg"
      >
        <HeaderPanelShell
          title={t("notificationsTitle")}
          emptyTitle={t("notificationsEmpty")}
          emptyHint={t("notificationsEmptyHint")}
          icon={<Bell className="size-4" />}
        />
      </PopoverContent>
    </Popover>
  );
}

function HeaderUserChip() {
  const tCommon = useTranslations("common");
  const [user, setUser] = useState<PortalSessionView["user"] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const session = await getPortalSessionView();
        if (!cancelled && session?.user) setUser(session.user);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const displayName =
    user.displayName?.trim() ||
    `${user.firstName} ${user.lastName}`.trim() ||
    user.username ||
    tCommon("userFallback");
  const initial = (user.firstName || displayName || "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2 shrink-0 min-w-0">
      <span className="hidden sm:inline text-sm font-semibold text-[color:var(--istikbal-blue)] truncate max-w-[10rem] lg:max-w-[14rem]">
        {displayName}
      </span>
      <div
        className="size-8 rounded-full bg-[color:var(--istikbal-blue)] text-white grid place-items-center text-xs font-bold shrink-0"
        aria-hidden
      >
        {initial}
      </div>
    </div>
  );
}

export function AppHeader({
  title,
  backHref,
  backLabel,
  actions,
  sticky = false,
}: AppHeaderProps) {
  const tCommon = useTranslations("common");
  const label =
    backLabel ?? (backHref === "/" ? tCommon("home") : tCommon("back"));

  return (
    <header
      className={`h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 z-30 ${
        sticky ? "sticky top-0" : ""
      }`}
    >
      <Link
        href={backHref}
        className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]"
      >
        <ArrowLeft className="size-4" /> {label}
      </Link>
      <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70 truncate">
        {title}
      </div>
      <div className="flex-1" />
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
      <div className="flex items-center gap-1.5 shrink-0">
        <HeaderCartBox />
        <HeaderNotificationsBox />
      </div>
      <HeaderUserChip />
    </header>
  );
}
