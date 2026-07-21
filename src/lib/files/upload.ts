"use client";

import { portalCrmFetch } from "@/lib/portal-crm";

/**
 * Upload a file through the Next BFF → CRM `/api/files/upload`.
 * Returns the public URL string from CRM.
 */
export async function uploadPortalFile(
  file: File,
  router?: { replace: (href: string) => void },
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const url = await portalCrmFetch<string>("files/upload", {
    method: "POST",
    body: formData,
    router,
  });
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed || trimmed.startsWith("Upload failed")) {
    throw new Error(trimmed || "Dosya yüklenemedi.");
  }
  // CRM may wrap the URL in quotes
  return trimmed.replace(/^"|"$/g, "");
}
