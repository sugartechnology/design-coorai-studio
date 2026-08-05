"use client";

import Link from "next/link";
import {
  Sofa,
  Sparkles,
  LayoutDashboard,
  Boxes,
  FileText,
  Settings,
  Users,
  ArrowUpRight,
  LogIn,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type SessionUser = {
  displayName: string;
  firstName: string;
  lastName: string;
};

type SessionPayload = {
  authenticated: boolean;
  user?: SessionUser;
};

/* ── Furniture-themed tile illustrations ── */
function FabricIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 170 Q40 150 80 170 T160 170 T240 170 V200 H0 Z" fill="currentColor" opacity="0.1" />
      <path d="M0 180 Q40 165 80 180 T160 180 T240 180" stroke="currentColor" strokeWidth="1.5" opacity="0.25" />
      <rect x="60" y="80" width="120" height="55" rx="10" fill="currentColor" opacity="0.22" />
      <rect x="50" y="95" width="22" height="45" rx="8" fill="currentColor" opacity="0.3" />
      <rect x="168" y="95" width="22" height="45" rx="8" fill="currentColor" opacity="0.3" />
      <rect x="75" y="110" width="40" height="25" rx="6" fill="currentColor" opacity="0.35" />
      <rect x="125" y="110" width="40" height="25" rx="6" fill="currentColor" opacity="0.35" />
      <rect x="58" y="135" width="10" height="14" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="172" y="135" width="10" height="14" rx="2" fill="currentColor" opacity="0.4" />
      <g opacity="0.3">
        <circle cx="30" cy="40" r="14" fill="currentColor" opacity="0.2" />
        <circle cx="30" cy="40" r="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="210" cy="30" r="10" stroke="currentColor" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function AiIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 60 L220 60 L220 150 L20 150 Z" stroke="currentColor" strokeWidth="2" opacity="0.25" />
      <path d="M20 150 L0 180 L240 180 L220 150 Z" fill="currentColor" opacity="0.08" />
      <rect x="70" y="110" width="100" height="40" rx="6" fill="currentColor" opacity="0.25" />
      <rect x="70" y="90" width="100" height="25" rx="6" fill="currentColor" opacity="0.18" />
      <line x1="40" y1="60" x2="40" y2="150" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M30 60 L50 60 L46 75 L34 75 Z" fill="currentColor" opacity="0.3" />
      <g opacity="0.55">
        <path d="M190 35 L194 47 L206 51 L194 55 L190 67 L186 55 L174 51 L186 47 Z" fill="currentColor" />
        <path d="M215 80 L217 86 L223 88 L217 90 L215 96 L213 90 L207 88 L213 86 Z" fill="currentColor" />
        <path d="M165 70 L167 76 L173 78 L167 80 L165 86 L163 80 L157 78 L163 76 Z" fill="currentColor" opacity="0.7" />
      </g>
    </svg>
  );
}

function RoomIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 160" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="15" width="210" height="130" rx="4" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <rect x="70" y="50" width="100" height="70" rx="4" fill="currentColor" opacity="0.08" />
      <rect x="30" y="35" width="70" height="22" rx="4" fill="currentColor" opacity="0.3" />
      <rect x="30" y="35" width="22" height="70" rx="4" fill="currentColor" opacity="0.3" />
      <rect x="150" y="105" width="60" height="20" rx="4" fill="currentColor" opacity="0.3" />
      <rect x="105" y="75" width="35" height="22" rx="3" fill="currentColor" opacity="0.4" />
      <rect x="150" y="25" width="60" height="14" rx="2" fill="currentColor" opacity="0.35" />
      <path d="M15 130 A20 20 0 0 1 35 110" stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
    </svg>
  );
}

function ModularIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="30" y="90" width="55" height="55" rx="8" fill="currentColor" opacity="0.28" />
      <rect x="30" y="80" width="55" height="18" rx="6" fill="currentColor" opacity="0.4" />
      <rect x="92" y="90" width="55" height="55" rx="8" fill="currentColor" opacity="0.22" />
      <rect x="92" y="80" width="55" height="18" rx="6" fill="currentColor" opacity="0.35" />
      <rect x="154" y="90" width="70" height="55" rx="8" fill="currentColor" opacity="0.18" />
      <rect x="154" y="80" width="40" height="18" rx="6" fill="currentColor" opacity="0.3" />
      <g opacity="0.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="88" y1="115" x2="88" y2="125" />
        <line x1="83" y1="120" x2="93" y2="120" />
        <line x1="150" y1="115" x2="150" y2="125" />
        <line x1="145" y1="120" x2="155" y2="120" />
      </g>
      <g opacity="0.5" fill="currentColor">
        <rect x="34" y="145" width="6" height="8" />
        <rect x="78" y="145" width="6" height="8" />
        <rect x="140" y="145" width="6" height="8" />
        <rect x="216" y="145" width="6" height="8" />
      </g>
    </svg>
  );
}

function OffersIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="48" y="28" width="110" height="145" rx="8" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <rect x="62" y="48" width="70" height="8" rx="2" fill="currentColor" opacity="0.28" />
      <rect x="62" y="68" width="82" height="6" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="62" y="84" width="82" height="6" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="62" y="100" width="55" height="6" rx="2" fill="currentColor" opacity="0.18" />
      <rect x="62" y="130" width="50" height="22" rx="4" fill="currentColor" opacity="0.22" />
      <rect x="130" y="55" width="95" height="110" rx="8" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" />
      <rect x="148" y="78" width="60" height="8" rx="2" fill="currentColor" opacity="0.25" />
      <rect x="148" y="98" width="48" height="6" rx="2" fill="currentColor" opacity="0.16" />
      <rect x="148" y="114" width="48" height="6" rx="2" fill="currentColor" opacity="0.16" />
    </svg>
  );
}

function SettingsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(100 100)">
        <circle r="32" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
        <circle r="12" fill="currentColor" opacity="0.3" />
        <g opacity="0.35" fill="currentColor">
          <rect x="-5" y="-46" width="10" height="14" rx="2" />
          <rect x="-5" y="32" width="10" height="14" rx="2" />
          <rect x="-46" y="-5" width="14" height="10" rx="2" />
          <rect x="32" y="-5" width="14" height="10" rx="2" />
          <rect x="-5" y="-46" width="10" height="14" rx="2" transform="rotate(45)" />
          <rect x="-5" y="-46" width="10" height="14" rx="2" transform="rotate(-45)" />
          <rect x="-5" y="32" width="10" height="14" rx="2" transform="rotate(45)" />
          <rect x="-5" y="32" width="10" height="14" rx="2" transform="rotate(-45)" />
        </g>
      </g>
      <g opacity="0.3">
        <rect x="25" y="160" width="60" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <line x1="35" y1="160" x2="35" y2="165" stroke="currentColor" />
        <line x1="45" y1="160" x2="45" y2="165" stroke="currentColor" />
        <line x1="55" y1="160" x2="55" y2="165" stroke="currentColor" />
        <line x1="65" y1="160" x2="65" y2="165" stroke="currentColor" />
        <line x1="75" y1="160" x2="75" y2="165" stroke="currentColor" />
      </g>
    </svg>
  );
}

function UsersIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="75" cy="70" r="16" fill="currentColor" opacity="0.32" />
      <path d="M48 130 c0-20 14-32 27-32 s27 12 27 32 v8 h-54 z" fill="currentColor" opacity="0.28" />
      <circle cx="130" cy="78" r="13" fill="currentColor" opacity="0.22" />
      <path d="M108 140 c0-16 12-26 22-26 s22 10 22 26 v6 h-44 z" fill="currentColor" opacity="0.2" />
      <g opacity="0.35" transform="translate(155 155)">
        <rect x="0" y="0" width="22" height="14" rx="2" fill="currentColor" />
        <rect x="0" y="-8" width="22" height="8" rx="2" fill="currentColor" />
        <line x1="3" y1="14" x2="3" y2="22" stroke="currentColor" strokeWidth="2" />
        <line x1="19" y1="14" x2="19" y2="22" stroke="currentColor" strokeWidth="2" />
      </g>
    </svg>
  );
}

type Tile = {
  title: string;
  subtitle: string;
  icon: typeof Sofa;
  to?: string;
  links?: { label: string; to: string }[];
  className: string;
  size: "lg" | "md" | "sm";
  decoration: React.FC<{ className?: string }>;
};

function Home() {
  const router = useRouter();
  const t = useTranslations("home");
  const tCommon = useTranslations("common");
  const [session, setSession] = useState<SessionPayload | null>(null);

  const tiles: Tile[] = [
    {
      title: t("tileFabricTitle"),
      subtitle: t("tileFabricSubtitle"),
      icon: Sofa,
      to: "/kumas",
      className:
        "bg-[color:var(--istikbal-blue)] text-white col-span-2 sm:col-span-3 row-span-2",
      size: "lg",
      decoration: FabricIllustration,
    },
    {
      title: t("tileAiTitle"),
      subtitle: t("tileAiSubtitle"),
      icon: Sparkles,
      to: "/ai",
      className:
        "bg-gradient-to-br from-[color:var(--istikbal-yellow)] to-[#f6b900] text-[color:var(--istikbal-blue)] col-span-2 sm:col-span-3 row-span-2",
      size: "lg",
      decoration: AiIllustration,
    },
    {
      title: t("tileRoomTitle"),
      subtitle: t("tileRoomSubtitle"),
      icon: LayoutDashboard,
      to: "/oda",
      className:
        "bg-white text-[color:var(--istikbal-blue)] col-span-2 row-span-2",
      size: "md",
      decoration: RoomIllustration,
    },
    {
      title: t("tileModularTitle"),
      subtitle: t("tileModularSubtitle"),
      icon: Boxes,
      to: "/moduler",
      className:
        "bg-[color:var(--istikbal-navy)] text-white col-span-2 row-span-2",
      size: "md",
      decoration: ModularIllustration,
    },
    {
      title: t("tileOffersTitle"),
      subtitle: t("tileOffersSubtitle"),
      icon: FileText,
      to: "/teklifler",
      className:
        "bg-white text-[color:var(--istikbal-blue)] col-span-2 row-span-2",
      size: "md",
      decoration: OffersIllustration,
    },
    {
      title: t("tileSettingsTitle"),
      subtitle: t("tileSettingsSubtitle"),
      icon: Settings,
      to: "/ayarlar",
      className:
        "bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] col-span-2 sm:col-span-3 row-span-1",
      size: "sm",
      decoration: SettingsIllustration,
    },
    {
      title: t("tileUsersTitle"),
      subtitle: t("tileUsersSubtitle"),
      icon: Users,
      to: "/kullanicilar",
      className:
        "bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)] col-span-2 sm:col-span-3 row-span-1",
      size: "sm",
      decoration: UsersIllustration,
    },
  ];

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data: SessionPayload) => {
        if (!cancelled) setSession(data);
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession({ authenticated: false });
    router.refresh();
  };

  const displayName = session?.user?.displayName || tCommon("dealerFallback");
  const initial = (session?.user?.firstName || displayName).charAt(0).toUpperCase() || "B";

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 border-b border-black/5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[color:var(--istikbal-yellow)] text-2xl sm:text-3xl leading-none">≋</span>
            <span className="text-xl sm:text-2xl font-extrabold italic text-[color:var(--istikbal-blue)] tracking-tight">
              istikbal
            </span>
          </div>
          <span className="ml-3 hidden md:inline text-sm font-medium text-[color:var(--istikbal-blue)]/60 truncate">
            {t("productSubtitle")}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {session?.authenticated ? (
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-full border border-[color:var(--istikbal-blue)]/15 text-[color:var(--istikbal-blue)] text-sm font-semibold hover:bg-[color:var(--istikbal-blue)]/5 transition-colors"
            >
              {t("logout")}
            </button>
          ) : (
            <Link href="/login"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-3 sm:px-4 rounded-full bg-[color:var(--istikbal-blue)] text-white text-sm font-semibold hover:bg-[color:var(--istikbal-navy)] transition-colors shadow-sm"
            >
              <LogIn className="size-4" />
              <span className="hidden sm:inline">{t("login")}</span>
            </Link>
          )}
          <span className="text-sm text-[color:var(--istikbal-blue)]/70 hidden md:inline">
            {session?.authenticated
              ? t("welcomeNamed", { name: displayName })
              : t("welcome")}
          </span>
          <div className="size-9 sm:size-10 rounded-full bg-[color:var(--istikbal-blue)] text-white grid place-items-center font-semibold">
            {initial}
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-7 lg:py-10 max-w-[1600px] mx-auto">
        <div className="mb-5 sm:mb-7 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-[color:var(--istikbal-blue)] tracking-tight">
            {t("headline")}
          </h1>
          <p className="mt-1.5 sm:mt-2 text-[color:var(--istikbal-blue)]/60 text-sm sm:text-base lg:text-lg">
            {t("subhead")}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 auto-rows-[130px] sm:auto-rows-[150px] lg:auto-rows-[180px] gap-3 sm:gap-4">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const Deco = tile.decoration;
            const inner = (
              <>
                <div className="flex items-start justify-between z-10">
                  <Icon
                    className={
                      tile.size === "lg"
                        ? "size-9 sm:size-11 lg:size-14"
                        : tile.size === "md"
                        ? "size-7 sm:size-9 lg:size-10"
                        : "size-6 sm:size-7 lg:size-8"
                    }
                    strokeWidth={1.5}
                  />
                  {tile.to && (
                    <ArrowUpRight className="size-4 sm:size-5 opacity-0 group-hover:opacity-70 transition-opacity" />
                  )}
                </div>
                <div className="z-10">
                  <h2
                    className={
                      tile.size === "lg"
                        ? "text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight"
                        : tile.size === "md"
                        ? "text-base sm:text-xl lg:text-2xl font-bold leading-tight"
                        : "text-sm sm:text-base lg:text-lg font-bold leading-tight"
                    }
                  >
                    {tile.title}
                  </h2>
                  <p
                    className={`mt-0.5 sm:mt-1 opacity-75 ${
                      tile.size === "sm" ? "text-[11px] sm:text-xs" : "text-xs sm:text-sm"
                    } line-clamp-2`}
                  >
                    {tile.subtitle}
                  </p>
                  {tile.links && (
                    <div className="mt-2 sm:mt-3 flex gap-1.5 sm:gap-2 flex-wrap">
                      {tile.links.map((link) => (
                        <Link key={link.to}
                          href={link.to}
                          className="inline-flex items-center gap-1 sm:gap-1.5 rounded-lg bg-black/10 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-sm font-medium hover:bg-black/20 transition-colors"
                        >
                          {link.label}
                          <ArrowUpRight className="size-3 sm:size-3.5" />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
                <Deco className="pointer-events-none absolute right-0 bottom-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 w-full h-full" />
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
              </>
            );
            const className = `group relative overflow-hidden rounded-2xl p-3 sm:p-4 lg:p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl shadow-md ${tile.className}`;

            if (tile.to) {
              return (
                <Link key={tile.title} href={tile.to} className={className}>
                  {inner}
                </Link>
              );
            }
            return (
              <div key={tile.title} className={className}>
                {inner}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

export default Home;
