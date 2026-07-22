/**
 * CRM/S3 bazen tek alanda iki URL döner:
 * `https://s3.../x.jpg;https://img-sugartech.mncdn.com/.../x.jpg`
 * Bu durumda ikinci (CDN) link tercih edilir.
 */
export function normalizeMediaUrl(url?: string | null): string {
  if (url == null) return "";
  let value = String(url).trim();
  if (!value) return "";

  const lowered = value.toLowerCase();
  if (lowered === "null" || lowered === "undefined") return "";

  value = value.replace(/%5C/gi, "/").replace(/\\/g, "/");

  if (value.includes(";")) {
    const parts = value
      .split(";")
      .map((part) => part.trim())
      .filter((part) => /^https?:\/\//i.test(part));
    if (parts.length >= 2) {
      // İstenen kural: çift URL varsa her zaman ikinci (CDN) link
      value = parts[1];
    } else if (parts.length === 1) {
      value = parts[0];
    }
  }

  return value;
}

export function normalizeMediaUrlOrNull(url?: string | null): string | null {
  const normalized = normalizeMediaUrl(url);
  return normalized || null;
}
