"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PlayCircle, X } from "lucide-react";
import { useTranslations } from "next-intl";

type TutorialMeta = {
  titleKey:
    | "defaultTitle"
    | "homeTitle"
    | "odaTitle"
    | "modulerTitle"
    | "sosyalTitle"
    | "kumasTitle"
    | "whatsappTitle"
    | "aiTitle"
    | "loginTitle";
  descriptionKey:
    | "defaultDescription"
    | "homeDescription"
    | "odaDescription"
    | "modulerDescription"
    | "sosyalDescription"
    | "kumasDescription"
    | "whatsappDescription"
    | "aiDescription"
    | "loginDescription";
  videoUrl: string;
};

const TUTORIALS: Record<string, TutorialMeta> = {
  "/": {
    titleKey: "homeTitle",
    descriptionKey: "homeDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/oda": {
    titleKey: "odaTitle",
    descriptionKey: "odaDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/moduler": {
    titleKey: "modulerTitle",
    descriptionKey: "modulerDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/sosyal": {
    titleKey: "sosyalTitle",
    descriptionKey: "sosyalDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/kumas": {
    titleKey: "kumasTitle",
    descriptionKey: "kumasDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/whatsapp-sms": {
    titleKey: "whatsappTitle",
    descriptionKey: "whatsappDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/ai": {
    titleKey: "aiTitle",
    descriptionKey: "aiDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
  "/login": {
    titleKey: "loginTitle",
    descriptionKey: "loginDescription",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  },
};

const DEFAULT_TUTORIAL: TutorialMeta = {
  titleKey: "defaultTitle",
  descriptionKey: "defaultDescription",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
};

function resolveTutorial(path: string): TutorialMeta {
  if (TUTORIALS[path]) return TUTORIALS[path];
  const base = "/" + path.split("/").filter(Boolean)[0];
  return TUTORIALS[base] ?? DEFAULT_TUTORIAL;
}

export function TutorialButton() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() || "/";
  const tutorial = resolveTutorial(pathname);
  const t = useTranslations("tutorial");
  const tCommon = useTranslations("common");
  const title = t(tutorial.titleKey);
  const description = t(tutorial.descriptionKey);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label={t("ariaWatch")}
        className="fixed bottom-6 right-6 z-[9998] flex items-center gap-2 rounded-full bg-[color:var(--brand-primary,#0066cc)] px-4 py-3 text-sm font-medium text-white shadow-lg shadow-black/20 hover:scale-105 hover:shadow-xl active:scale-95"
        style={{ transition: "transform 150ms, box-shadow 150ms" }}
      >
        <PlayCircle className="h-5 w-5" />
        <span className="hidden sm:inline">{t("buttonLabel")}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{description}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label={tCommon("close")}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video w-full bg-black">
              <iframe
                key={tutorial.videoUrl}
                src={tutorial.videoUrl}
                title={title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
