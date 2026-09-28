function clickDownload(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export function imageDownloadName(url: string, fallback = "render.jpg"): string {
  try {
    const base = new URL(url).pathname.split("/").pop() || fallback;
    const clean = decodeURIComponent(base).replace(/[^\w.\-]+/g, "_");
    if (/\.(png|jpe?g|webp|gif)$/i.test(clean)) return clean.slice(0, 120);
  } catch {
    // data URLs and relative paths fall through
  }
  return fallback;
}

async function blobFromUrl(url: string, filename: string): Promise<Blob> {
  try {
    const direct = await fetch(url);
    if (direct.ok) {
      const blob = await direct.blob();
      if (blob.size > 0 && (blob.type === "" || blob.type.startsWith("image/"))) {
        return blob;
      }
    }
  } catch {
    // Cross-origin images often block a direct fetch.
  }

  const proxied = await fetch(
    `/api/media/download?url=${encodeURIComponent(url)}&name=${encodeURIComponent(filename)}`,
  );
  if (!proxied.ok) throw new Error("download");
  return proxied.blob();
}

/** Save an image without navigating away or opening a new tab. */
export async function downloadImageFile(url: string, filename: string): Promise<void> {
  if (!url) return;
  if (url.startsWith("data:")) {
    clickDownload(url, filename);
    return;
  }
  const blob = await blobFromUrl(url, filename);
  const objectUrl = URL.createObjectURL(blob);
  clickDownload(objectUrl, filename);
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}
