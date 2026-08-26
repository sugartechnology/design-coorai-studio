"use client";

export default function KumasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-dvh bg-[color:var(--brand-bg)] flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
