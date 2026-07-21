"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Users,
  Crown,
  ShieldCheck,
  User as UserIcon,
  Eye,
  MoreVertical,
  Mail,
  Check,
  X,
  Loader2,
  Phone,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { redirectToLoginOnUnauthorized } from "@/lib/auth-redirect";
import { localizeCrmError } from "@/lib/crm-errors";

type Role = "Sahip" | "Yönetici" | "Tasarımcı" | "Görüntüleyici";
type Status = "Aktif" | "Davet" | "Pasif";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  roleLabel: string;
  status: Status;
  lastSeen: string;
  initials: string;
  color: string;
};

type CrmRole = { id?: string; name?: string };
type CrmUser = {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  status?: string | null;
  forcePasswordChange?: boolean;
  updatedAt?: string;
  roleAssignments?: Array<{
    companyId?: string;
    roles?: CrmRole[];
  }>;
};

type CrmUsersPage = {
  content?: CrmUser[];
  totalElements?: number;
};

const ROLE_META: Record<
  Role,
  { icon: React.ComponentType<{ className?: string }>; label: string; tint: string }
> = {
  Sahip: {
    icon: Crown,
    label: "Tüm yetkiler + faturalama",
    tint: "bg-[color:var(--istikbal-yellow)]/20 text-amber-700",
  },
  Yönetici: {
    icon: ShieldCheck,
    label: "Kullanıcı ve içerik yönetimi",
    tint: "bg-[color:var(--istikbal-blue)]/10 text-[color:var(--istikbal-blue)]",
  },
  Tasarımcı: {
    icon: UserIcon,
    label: "Oda, render ve kumaş düzenleme",
    tint: "bg-violet-100 text-violet-700",
  },
  Görüntüleyici: {
    icon: Eye,
    label: "Sadece görüntüleme",
    tint: "bg-stone-100 text-stone-600",
  },
};

const AVATAR_COLORS = ["#1f5fa8", "#2da5b8", "#7d57c1", "#e85d3a", "#0d3b73", "#f5b945"];

function mapCrmRole(roleNames: string[]): { role: Role; roleLabel: string } {
  const normalized = roleNames.map((n) => n.trim().toLowerCase());
  if (normalized.some((n) => n === "admin" || n.includes("yönetici") || n.includes("yonetici"))) {
    if (normalized.some((n) => n.includes("sahip") || n.includes("owner"))) {
      return { role: "Sahip", roleLabel: roleNames[0] ?? "Sahip" };
    }
    return { role: "Yönetici", roleLabel: roleNames.find((n) => /admin|yönetici|yonetici/i.test(n)) ?? roleNames[0] ?? "Yönetici" };
  }
  if (normalized.some((n) => n.includes("temsilci") || n.includes("tasarım") || n.includes("designer"))) {
    return {
      role: "Tasarımcı",
      roleLabel: roleNames.find((n) => /temsilci|tasarım|designer/i.test(n)) ?? roleNames[0] ?? "Tasarımcı",
    };
  }
  return {
    role: "Görüntüleyici",
    roleLabel: roleNames[0] ?? "Görüntüleyici",
  };
}

function mapStatus(user: CrmUser): Status {
  const raw = (user.status ?? "").trim().toLowerCase();
  if (raw === "passive" || raw === "pasif" || raw === "inactive" || raw === "disabled") {
    return "Pasif";
  }
  if (raw === "invite" || raw === "davet" || raw === "pending") {
    return "Davet";
  }
  return "Aktif";
}

function formatLastSeen(updatedAt?: string): string {
  if (!updatedAt) return "—";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "—";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Şimdi";
  if (mins < 60) return `${mins} dk önce`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Dün";
  if (days < 14) return `${days} gün önce`;
  return date.toLocaleDateString("tr-TR");
}

function initialsOf(firstName?: string, lastName?: string, email?: string): string {
  const a = (firstName ?? "").trim().charAt(0);
  const b = (lastName ?? "").trim().charAt(0);
  if (a || b) return `${a}${b}`.toUpperCase();
  return (email ?? "?").trim().charAt(0).toUpperCase();
}

function toMember(user: CrmUser, index: number): Member {
  const roleNames =
    user.roleAssignments?.flatMap((assignment) =>
      (assignment.roles ?? []).map((role) => role.name ?? "").filter(Boolean),
    ) ?? [];
  const { role, roleLabel } = mapCrmRole(roleNames);
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.username || user.email || "Kullanıcı";
  return {
    id: user.id,
    name,
    email: user.email ?? "—",
    phone: user.phoneNumber ?? "—",
    role,
    roleLabel,
    status: mapStatus(user),
    lastSeen: formatLastSeen(user.updatedAt),
    initials: initialsOf(user.firstName, user.lastName, user.email),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
  };
}

function KullanicilarPage() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"Tümü" | Role>("Tümü");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json().catch(() => ({}));
      if (!session?.authenticated) {
        router.replace("/login");
        return;
      }

      const companyId = session.companyId as string | undefined;
      const params = new URLSearchParams({ size: "100", page: "0", sort: "createdAt,desc" });
      if (companyId) params.set("companyId", companyId);

      const res = await fetch(`/api/crm/users/all?${params.toString()}`, {
        credentials: "include",
      });
      if (redirectToLoginOnUnauthorized(res.status, router)) {
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(localizeCrmError(body, "Kullanıcılar yüklenemedi."));
      }
      const page = (await res.json()) as CrmUsersPage;
      setMembers((page.content ?? []).map(toMember));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kullanıcılar yüklenemedi.");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchQ =
        !q ||
        m.name.toLowerCase().includes(q.toLowerCase()) ||
        m.email.toLowerCase().includes(q.toLowerCase()) ||
        m.phone.toLowerCase().includes(q.toLowerCase());
      const matchR = filter === "Tümü" || m.role === filter;
      return matchQ && matchR;
    });
  }, [q, filter, members]);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.status === "Aktif").length,
      pending: members.filter((m) => m.status === "Davet").length,
      admins: members.filter((m) => m.role === "Sahip" || m.role === "Yönetici").length,
    }),
    [members],
  );

  return (
    <div className="min-h-screen bg-[color:var(--istikbal-bg)]">
      <header className="h-14 bg-white border-b border-black/5 flex items-center px-6 gap-4 shrink-0 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[color:var(--istikbal-blue)]">
          <ArrowLeft className="size-4" /> Geri
        </Link>
        <div className="text-xs font-bold tracking-[0.18em] text-[color:var(--istikbal-blue)]/70">KULLANICILAR</div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => void loadUsers()}
          className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--istikbal-blue)]/15 text-[color:var(--istikbal-blue)] text-xs font-semibold px-3 py-2 hover:bg-[color:var(--istikbal-blue-soft)]"
        >
          Yenile
        </button>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/90 text-white text-xs font-semibold px-3 py-2 shadow-sm"
        >
          <Plus className="size-4" /> Davet Et
        </button>
      </header>

      <div className="px-4 md:px-8 py-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Toplam Üye" value={stats.total} icon={Users} />
          <StatCard label="Aktif" value={stats.active} icon={Check} accent="emerald" />
          <StatCard label="Bekleyen Davet" value={stats.pending} icon={Mail} accent="amber" />
          <StatCard label="Yönetici Sayısı" value={stats.admins} icon={ShieldCheck} />
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="İsim, e-posta veya telefon ara…"
              className="w-full rounded-2xl bg-white border border-black/5 text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/35 pl-10 pr-4 py-3 outline-none focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/10"
            />
          </div>
          <div className="inline-flex bg-white border border-black/5 rounded-2xl p-1 overflow-x-auto">
            {(["Tümü", "Sahip", "Yönetici", "Tasarımcı", "Görüntüleyici"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilter(r)}
                className={[
                  "px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition",
                  filter === r
                    ? "bg-[color:var(--istikbal-blue)] text-white shadow-sm"
                    : "text-[color:var(--istikbal-blue)]/65 hover:bg-[color:var(--istikbal-blue-soft)]",
                ].join(" ")}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-3xl bg-white border border-black/5 shadow-sm overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-3 bg-[color:var(--istikbal-blue-soft)]/50 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">
            <div className="col-span-4">Üye</div>
            <div className="col-span-3">Rol</div>
            <div className="col-span-2">Durum</div>
            <div className="col-span-2">Son Güncelleme</div>
            <div className="col-span-1 text-right">İşlem</div>
          </div>

          {loading && (
            <div className="p-12 flex flex-col items-center gap-3 text-[color:var(--istikbal-blue)]/70">
              <Loader2 className="size-8 animate-spin" />
              <p className="text-sm font-medium">Kullanıcılar yükleniyor…</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="p-12 text-center">
              <div className="size-14 mx-auto rounded-2xl bg-[color:var(--istikbal-blue-soft)] grid place-items-center text-[color:var(--istikbal-blue)]/50">
                <Users className="size-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-[color:var(--istikbal-blue)]">
                {members.length === 0 ? "Henüz kullanıcı yok" : "Eşleşen kullanıcı yok"}
              </p>
              <p className="text-xs text-[color:var(--istikbal-blue)]/55">
                {members.length === 0
                  ? "Oturumdaki şirket için CRM kullanıcı listesi boş."
                  : "Arama veya filtreyi değiştirmeyi dene."}
              </p>
            </div>
          )}

          {!loading && (
            <ul className="divide-y divide-black/5">
              {filtered.map((m) => {
                const RoleIcon = ROLE_META[m.role].icon;
                return (
                  <li
                    key={m.id}
                    className="grid grid-cols-12 gap-3 items-center px-4 md:px-6 py-4 hover:bg-[color:var(--istikbal-blue-soft)]/30 transition"
                  >
                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                      <div
                        className="size-11 rounded-2xl grid place-items-center text-white text-sm font-bold shrink-0"
                        style={{ background: m.color }}
                      >
                        {m.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[color:var(--istikbal-blue)] truncate">{m.name}</p>
                        <p className="text-xs text-[color:var(--istikbal-blue)]/55 truncate flex items-center gap-1">
                          <Mail className="size-3" /> {m.email}
                        </p>
                        {m.phone !== "—" && (
                          <p className="text-xs text-[color:var(--istikbal-blue)]/45 truncate flex items-center gap-1 mt-0.5">
                            <Phone className="size-3" /> {m.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="col-span-6 md:col-span-3">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold",
                          ROLE_META[m.role].tint,
                        ].join(" ")}
                      >
                        <RoleIcon className="size-3.5" /> {m.role}
                      </span>
                      <p className="hidden md:block text-[11px] text-[color:var(--istikbal-blue)]/45 mt-1 truncate">
                        {m.roleLabel}
                      </p>
                    </div>

                    <div className="col-span-6 md:col-span-2">
                      <StatusBadge status={m.status} />
                    </div>

                    <div className="hidden md:block col-span-2 text-xs text-[color:var(--istikbal-blue)]/60">
                      {m.lastSeen}
                    </div>

                    <div className="col-span-12 md:col-span-1 flex md:justify-end">
                      <button
                        type="button"
                        className="size-9 grid place-items-center rounded-xl text-[color:var(--istikbal-blue)]/60 hover:bg-[color:var(--istikbal-blue-soft)] hover:text-[color:var(--istikbal-blue)]"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-3xl bg-white border border-black/5 shadow-sm p-6">
          <h2 className="text-base font-extrabold text-[color:var(--istikbal-blue)] tracking-tight mb-1">Roller</h2>
          <p className="text-xs text-[color:var(--istikbal-blue)]/60 mb-4">CRM rollerinin portal özeti.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(ROLE_META) as Role[]).map((r) => {
              const Icon = ROLE_META[r].icon;
              const count = members.filter((m) => m.role === r).length;
              return (
                <div key={r} className="rounded-2xl bg-[color:var(--istikbal-blue-soft)]/40 p-4 border border-black/5">
                  <div className="flex items-center justify-between">
                    <span className={["inline-flex items-center justify-center size-10 rounded-xl", ROLE_META[r].tint].join(" ")}>
                      <Icon className="size-5" />
                    </span>
                    <span className="text-2xl font-extrabold text-[color:var(--istikbal-blue)]">{count}</span>
                  </div>
                  <p className="text-sm font-bold text-[color:var(--istikbal-blue)] mt-3">{r}</p>
                  <p className="text-xs text-[color:var(--istikbal-blue)]/55 mt-0.5">{ROLE_META[r].label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "emerald" | "amber";
}) {
  const tint =
    accent === "emerald"
      ? "bg-emerald-100 text-emerald-700"
      : accent === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)]";
  return (
    <div className="rounded-2xl bg-white border border-black/5 p-4 shadow-sm flex items-center gap-3">
      <span className={["size-11 rounded-xl grid place-items-center shrink-0", tint].join(" ")}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/55 truncate">
          {label}
        </p>
        <p className="text-2xl font-extrabold text-[color:var(--istikbal-blue)] leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    Aktif: "bg-emerald-100 text-emerald-700",
    Davet: "bg-amber-100 text-amber-700",
    Pasif: "bg-stone-100 text-stone-500",
  };
  const dot: Record<Status, string> = {
    Aktif: "bg-emerald-500",
    Davet: "bg-amber-500",
    Pasif: "bg-stone-400",
  };
  return (
    <span className={["inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold", map[status]].join(" ")}>
      <span className={["size-1.5 rounded-full", dot[status]].join(" ")} />
      {status}
    </span>
  );
}

function InviteModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Tasarımcı");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="size-8 grid place-items-center rounded-xl bg-[color:var(--istikbal-blue)] text-white">
              <Plus className="size-4" />
            </span>
            <h3 className="text-sm font-extrabold text-[color:var(--istikbal-blue)]">Kullanıcı Davet Et</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 grid place-items-center rounded-xl hover:bg-[color:var(--istikbal-blue-soft)] text-[color:var(--istikbal-blue)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[color:var(--istikbal-blue)]/60 leading-relaxed">
            Davet şu an UI hazır; CRM create/invite endpoint bağlantısı sonraki adımda eklenecek.
          </p>
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">
              E-posta
            </span>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[color:var(--istikbal-blue)]/40" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="kisi@istikbal.com.tr"
                className="w-full rounded-xl bg-[color:var(--istikbal-blue-soft)]/50 border border-transparent text-sm text-[color:var(--istikbal-blue)] placeholder:text-[color:var(--istikbal-blue)]/35 pl-10 pr-4 py-2.5 outline-none focus:bg-white focus:border-[color:var(--istikbal-blue)]/30 focus:ring-4 focus:ring-[color:var(--istikbal-blue)]/10"
              />
            </div>
          </label>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--istikbal-blue)]/60">
              Rol
            </span>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {(["Yönetici", "Tasarımcı", "Görüntüleyici"] as Role[]).map((r) => {
                const Icon = ROLE_META[r].icon;
                const isActive = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      "rounded-xl p-3 text-left border-2 transition",
                      isActive
                        ? "border-[color:var(--istikbal-blue)] bg-[color:var(--istikbal-blue-soft)]"
                        : "border-transparent bg-[color:var(--istikbal-blue-soft)]/40 hover:bg-[color:var(--istikbal-blue-soft)]",
                    ].join(" ")}
                  >
                    <Icon className="size-4 text-[color:var(--istikbal-blue)]" />
                    <p className="text-xs font-bold text-[color:var(--istikbal-blue)] mt-2">{r}</p>
                    <p className="text-[10px] text-[color:var(--istikbal-blue)]/55 leading-tight mt-0.5">
                      {ROLE_META[r].label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 bg-[color:var(--istikbal-blue-soft)]/30 border-t border-black/5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-4 py-2.5 rounded-xl text-[color:var(--istikbal-blue)]/70 hover:bg-white"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-[color:var(--istikbal-blue)] hover:bg-[color:var(--istikbal-blue)]/90 text-white text-xs font-semibold px-4 py-2.5 shadow-sm"
          >
            <Mail className="size-3.5" /> Daveti Gönder
          </button>
        </div>
      </div>
    </div>
  );
}

export default KullanicilarPage;
