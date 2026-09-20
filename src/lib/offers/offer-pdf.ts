import type { OfferProductResponse, OfferResponse, OfferSectionResponse } from "./types";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money(amount: number | undefined, currency: string | undefined): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `${amount.toLocaleString("tr-TR")} ${currency || "TRY"}`.trim();
}

function productNote(product: OfferProductResponse): string {
  const fromVariants = (product.variantSelections ?? [])
    .map((selection) => {
      const option = selection.optionName?.trim();
      const value = selection.valueName?.trim();
      if (!option && !value) return "";
      return [option, value].filter(Boolean).join(": ");
    })
    .filter(Boolean);
  if (fromVariants.length) return fromVariants.join(" · ");
  const note = product.note?.trim();
  if (!note) return "";
  return note
    .replace(/\s+(?=RapidRender\s)/g, "\n")
    .replace(/\s+(?=Konfigürasyon:)/g, "\n")
    .replace(/\s+(?=Kaynak Satır ID:)/g, "\n")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^RapidRender\s+(Ürün|Şirket)\s+ID:/i.test(line))
    .filter((line) => !/^Kaynak Satır ID:/i.test(line))
    .map((line) => line.replace(/^Konfigürasyon:\s*/i, ""))
    .filter(Boolean)
    .join(" · ");
}

function customerName(
  offer: OfferResponse,
  fallback: string,
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  const customer = offer.customer;
  if (!customer) return fallback;
  const name = [customer.firstName, customer.lastName].filter(Boolean).join(" ").trim();
  return name || customer.companyName || customer.customerCompanyName || customer.email || fallback;
}

function sectionHtml(section: OfferSectionResponse, currency: string | undefined): string {
  const name = escapeHtml(section.name?.trim() || "SECTION");
  const images = (section.images ?? [])
    .filter((image) => image.imageUrl?.trim())
    .sort((a, b) => (a.imageOrder ?? 0) - (b.imageOrder ?? 0));
  const imageBlock = images.length
    ? `<div class="images">${images
        .map(
          (image) =>
            `<figure><img src="${escapeHtml(image.imageUrl || "")}" alt="${escapeHtml(image.caption || "")}" />${
              image.caption ? `<figcaption>${escapeHtml(image.caption)}</figcaption>` : ""
            }</figure>`,
        )
        .join("")}</div>`
    : "";
  const products = section.products ?? [];
  const rows = products
    .map((product, index) => {
      const qty = product.quantity ?? 0;
      const price = product.price ?? 0;
      const total = product.totalPrice ?? price * qty;
      const note = productNote(product);
      return `<tr>
        <td>${String(product.productOrder ?? index + 1).padStart(2, "0")}</td>
        <td><strong>${escapeHtml(product.name || product.sku || product.productId || "")}</strong>${
          note ? `<div class="note">${escapeHtml(note)}</div>` : ""
        }</td>
        <td class="num">${qty}</td>
        <td class="num">${escapeHtml(money(price, product.currency || currency))}</td>
        <td class="num">${escapeHtml(money(total, product.currency || currency))}</td>
      </tr>`;
    })
    .join("");
  return `<section>
    <h2>${name}</h2>
    ${imageBlock}
    <table>
      <thead><tr><th>#</th><th>Ürün</th><th>Miktar</th><th>Birim Fiyatı</th><th>Toplam Tutar</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="5">—</td></tr>`}</tbody>
    </table>
  </section>`;
}

export function buildOfferPdfHtml(
  offer: OfferResponse,
  labels: { untitled: string; noCustomer: string; customer?: string },
): string {
  const title = escapeHtml(offer.title?.trim() || labels.untitled);
  const number = offer.offerNumber ? `#${escapeHtml(offer.offerNumber)}` : "";
  const customer = escapeHtml(customerName(offer, labels.noCustomer, labels.customer));
  const status = escapeHtml(offer.status || "PENDING");
  const currency = offer.currency || "TRY";
  const sections = [...(offer.sections ?? [])].sort(
    (a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0),
  );
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Arial, sans-serif; color: #123; font-size: 12px; margin: 24px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .meta { color: #556; margin-bottom: 16px; }
    h2 { font-size: 13px; letter-spacing: .08em; text-transform: uppercase; margin: 18px 0 8px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #e6e6e6; padding: 8px 6px; text-align: left; vertical-align: top; }
    th { font-size: 10px; color: #667; }
    .num { text-align: right; white-space: nowrap; }
    .note { color: #667; font-size: 11px; margin-top: 2px; }
    .images { display: flex; gap: 8px; margin-bottom: 10px; }
    .images figure { margin: 0; width: 32%; }
    .images img { width: 100%; height: 120px; object-fit: cover; }
    figcaption { font-size: 10px; color: #667; margin-top: 4px; }
    .total { text-align: right; font-weight: 700; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">${[number, customer, status].filter(Boolean).join(" · ")}</div>
  ${sections.map((section) => sectionHtml(section, currency)).join("")}
  <div class="total">Toplam: ${escapeHtml(money(offer.totalPrice, currency))}</div>
</body>
</html>`;
}

export async function downloadOfferPdf(
  offer: OfferResponse,
  labels: { untitled: string; noCustomer: string; error: string; customer?: string },
): Promise<void> {
  const filename = `${(offer.offerNumber || offer.id || "offer").replace(/[^\w.\-]+/g, "_")}.pdf`;
  const response = await fetch("/api/pdf/offer", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html: buildOfferPdfHtml(offer, labels),
      filename,
    }),
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
