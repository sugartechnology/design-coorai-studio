"use client";

const loadCache = new Map<string, Promise<void>>();

/**
 * Load a public ESM vendor bundle via <script type="module">.
 * Prefer this over dynamic `import("/vendor/...")` — Next/Turbopack can
 * mis-resolve absolute public URLs and fail even when the file exists.
 */
export function loadVendorCustomElement(
  scriptSrc: string,
  tagName: string,
): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get(tagName)) return Promise.resolve();

  const cacheKey = `${scriptSrc}::${tagName}`;
  const existing = loadCache.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (customElements.get(tagName)) {
        resolve();
        return;
      }
      customElements
        .whenDefined(tagName)
        .then(() => resolve())
        .catch(reject);
    };

    const attr = "data-sugar-vendor";
    const found = document.querySelector<HTMLScriptElement>(
      `script[${attr}="${CSS.escape(scriptSrc)}"]`,
    );
    if (found) {
      if (found.dataset.loaded === "1") {
        finish();
        return;
      }
      found.addEventListener("load", finish, { once: true });
      found.addEventListener(
        "error",
        () => reject(new Error(`Failed to load ${scriptSrc}`)),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = scriptSrc;
    script.async = true;
    script.setAttribute(attr, scriptSrc);
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "1";
        finish();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error(`Failed to load ${scriptSrc}`)),
      { once: true },
    );
    document.head.appendChild(script);
  }).catch((err) => {
    loadCache.delete(cacheKey);
    throw err;
  });

  loadCache.set(cacheKey, promise);
  return promise;
}
