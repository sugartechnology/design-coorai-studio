"use client";

import Link from "next/link";
import { ArrowLeft, Bell, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
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

function HeaderCartBox() {
  const t = useTranslations("common");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <HeaderIconButton label={t("cartTitle")}>
          <ShoppingBag className="size-4" />
        </HeaderIconButton>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 rounded-2xl border border-black/5 bg-white p-4 shadow-lg"
      >
        <HeaderPanelShell
          title={t("cartTitle")}
          emptyTitle={t("cartEmpty")}
          emptyHint={t("cartEmptyHint")}
          icon={<ShoppingBag className="size-4" />}
        />
      </PopoverContent>
    </Popover>
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
