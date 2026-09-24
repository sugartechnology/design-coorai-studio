"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  listRapidRenderGallery,
  listRoomRenderGallery,
  PlannerRenderAuthError,
  type GalleryRenderItem,
} from "@/lib/planner-renders";

type GalleryTab = "rapid" | "room";

const PAGE_SIZE = 12;

type OfferImagePickerProps = {
  open: boolean;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (src: string) => void;
};

export function OfferImagePicker({
  open,
  busy = false,
  onOpenChange,
  onPick,
}: OfferImagePickerProps) {
  const t = useTranslations("offers");
  const [tab, setTab] = useState<GalleryTab>("rapid");
  const [roomItems, setRoomItems] = useState<GalleryRenderItem[]>([]);
  const [rapidItems, setRapidItems] = useState<GalleryRenderItem[]>([]);
  const [rapidPage, setRapidPage] = useState(0);
  const [rapidTotalPages, setRapidTotalPages] = useState(0);
  const [rapidLoading, setRapidLoading] = useState(false);
  const [rapidAuth, setRapidAuth] = useState(false);
  const [rapidError, setRapidError] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setRoomItems(listRoomRenderGallery());
    setTab("rapid");
    setRapidItems([]);
    setRapidPage(0);
    setRapidTotalPages(0);
    setRapidAuth(false);
    setRapidError(false);
    setRapidLoading(true);

    void (async () => {
      try {
        const page = await listRapidRenderGallery(1, PAGE_SIZE);
        if (cancelled) return;
        setRapidPage(page.page);
        setRapidTotalPages(page.totalPages);
        setRapidItems(page.items);
      } catch (error) {
        if (cancelled) return;
        if (error instanceof PlannerRenderAuthError) setRapidAuth(true);
        else setRapidError(true);
      } finally {
        if (!cancelled) setRapidLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const loadMore = async () => {
    if (rapidLoading || rapidPage >= rapidTotalPages) return;
    setRapidLoading(true);
    setRapidError(false);
    try {
      const page = await listRapidRenderGallery(rapidPage + 1, PAGE_SIZE);
      setRapidPage(page.page);
      setRapidTotalPages(page.totalPages);
      setRapidItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
    } catch (error) {
      if (error instanceof PlannerRenderAuthError) setRapidAuth(true);
      else setRapidError(true);
    } finally {
      setRapidLoading(false);
    }
  };

  const items = tab === "room" ? roomItems : rapidItems;
  const hasMore =
    tab === "rapid" && rapidTotalPages > 0 && rapidPage < rapidTotalPages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(40rem,85dvh)] max-w-2xl flex-col gap-3 overflow-hidden sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="pr-6 text-base text-[color:var(--brand-primary)]">
            {t("detailAddImage")}
          </DialogTitle>
        </DialogHeader>

        <div
          className="flex gap-1 rounded-xl bg-[color:var(--brand-primary)]/[0.06] p-1"
          role="tablist"
        >
          <TabButton
            selected={tab === "rapid"}
            label={t("detailGalleryRapid")}
            onClick={() => setTab("rapid")}
          />
          <TabButton
            selected={tab === "room"}
            label={t("detailGalleryRoom")}
            onClick={() => setTab("room")}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {tab === "rapid" && rapidAuth ? (
            <StatusText>{t("detailGalleryAuth")}</StatusText>
          ) : tab === "rapid" && rapidError && items.length === 0 ? (
            <StatusText>{t("detailGalleryError")}</StatusText>
          ) : tab === "rapid" && rapidLoading && items.length === 0 ? (
            <StatusText>
              <Loader2 className="size-4 animate-spin" />
            </StatusText>
          ) : items.length === 0 ? (
            <StatusText>
              {tab === "room" ? t("detailGalleryRoomEmpty") : t("detailGalleryRapidEmpty")}
            </StatusText>
          ) : (
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPick(item.src)}
                    className="block w-full overflow-hidden rounded-xl border border-black/5 bg-white disabled:opacity-40"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.src}
                      alt=""
                      className="h-28 w-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hasMore ? (
            <button
              type="button"
              disabled={busy || rapidLoading}
              onClick={() => void loadMore()}
              className="mt-3 inline-flex h-9 items-center justify-center rounded-xl px-3 text-xs font-bold text-[color:var(--brand-primary)] hover:bg-[color:var(--brand-primary)]/5 disabled:opacity-40"
            >
              {rapidLoading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                t("detailGalleryLoadMore")
              )}
            </button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TabButton({
  selected,
  label,
  onClick,
}: {
  selected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onClick}
      className={
        selected
          ? "h-8 flex-1 rounded-lg bg-white text-xs font-bold text-[color:var(--brand-primary)] shadow-sm"
          : "h-8 flex-1 rounded-lg text-xs font-bold text-[color:var(--brand-primary)]/55"
      }
    >
      {label}
    </button>
  );
}

function StatusText({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 px-2 py-10 text-center text-sm text-[color:var(--brand-primary)]/55">
      {children}
    </p>
  );
}
