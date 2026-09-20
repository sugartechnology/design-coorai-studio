"use client";

import { uploadPortalFile } from "@/lib/files/upload";
import type { QuoteDraft, QuoteSectionMeta } from "./types";

export type QuoteCaptureViews = {
  top?: string;
  perspective?: string;
};

type QuoteViewHost = {
  api?: {
    execute: (name: string, request: unknown) => unknown;
  };
};

type RouterLike = { replace: (href: string) => void };

async function dataUrlToFile(
  dataUrl: string,
  basename: string,
): Promise<File | null> {
  if (!dataUrl.startsWith("data:")) return null;
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  if (!blob.size) return null;
  const mime = blob.type || "image/png";
  const ext = mime.includes("jpeg") ? "jpg" : mime.includes("webp") ? "webp" : "png";
  return new File([blob], `${basename}.${ext}`, { type: mime });
}

async function uploadView(
  dataUrl: string | undefined,
  basename: string,
  caption: string,
  imageOrder: number,
  router?: RouterLike,
): Promise<NonNullable<QuoteSectionMeta["images"]>[number] | null> {
  if (!dataUrl?.trim()) return null;
  const file = await dataUrlToFile(dataUrl, basename);
  if (!file) return null;
  const url = await uploadPortalFile(file, router);
  return {
    imageUrl: url,
    thumbnailUrl: url,
    caption,
    altText: caption,
    imageOrder,
  };
}

/** Capture top + perspective (same as PDF quote) and upload for RapidRender section.images. */
export async function attachQuoteViewImages(
  draft: QuoteDraft,
  host: QuoteViewHost | null | undefined,
  options: {
    router?: RouterLike;
    captions: { top: string; perspective: string };
  },
): Promise<QuoteDraft> {
  if (!host?.api) return draft;
  try {
    const captured = (await Promise.resolve(
      host.api.execute("quote.captureViews", undefined),
    )) as QuoteCaptureViews | null;
    const images = (
      await Promise.all([
        uploadView(captured?.top, "quote-top", options.captions.top, 0, options.router),
        uploadView(
          captured?.perspective,
          "quote-perspective",
          options.captions.perspective,
          1,
          options.router,
        ),
      ])
    ).filter((image): image is NonNullable<typeof image> => Boolean(image));
    if (!images.length) return draft;
    return {
      ...draft,
      section: {
        ...draft.section,
        images,
      },
    };
  } catch (err) {
    console.warn("[oda] quote view capture/upload failed", err);
    return draft;
  }
}
