import type { OfferResponse } from "./types";

export async function downloadOfferPdf(
  offer: OfferResponse,
  labels: { error: string },
): Promise<void> {
  const filename = `${(offer.offerNumber || offer.id || "offer").replace(/[^\w.\-]+/g, "_")}.pdf`;
  const response = await fetch(`/api/offers/${encodeURIComponent(offer.id)}/pdf`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    let message = labels.error;
    try {
      const data = (await response.json()) as { message?: string; error?: string };
      message = data.message || data.error || labels.error;
    } catch {
      /* keep fallback */
    }
    throw new Error(message);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
