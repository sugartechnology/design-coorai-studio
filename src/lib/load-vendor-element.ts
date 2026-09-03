"use client";

const loadCache = new Map<string, Promise<void>>();

function vendorPath(src: string): string {
  return src.split("?")[0] ?? src;
}

/** Bundles that register the same Lit tags (sugar-light, sugar-viewport, …). */
const EXCLUSIVE_VENDOR_SRCS = [
  "/vendor/sugar-model-viewer.js",
  "https://s3.eu-central-1.amazonaws.com/cdn.sugartech/mottobucket/CDN/sugar-planner/sugar-room-designer.js",
] as const;

/** Tags registered by both exclusive vendor bundles. */
const SHARED_CORE_TAGS = [
  "sugar-light",
  "sugar-viewport",
  "sugar-canvas",
] as const;

const RELOAD_GUARD_KEY = "__sugar_ce_vendor_reload";

/**
 * CustomElementRegistry cannot unregister. Loading model-viewer then
 * room-designer (or the reverse) via client navigation redefines shared
 * tags — or worse, skips redefine and mixes classes (applySettings crashes).
 * Hard-reload clears the registry for the product that is mounting now.
 */
function hasConflictingVendor(scriptSrc: string, tagName: string): boolean {
  if (customElements.get(tagName)) return false;

  const incoming = vendorPath(scriptSrc);
  for (const src of EXCLUSIVE_VENDOR_SRCS) {
    if (src === incoming) continue;
    if (
      document.querySelector(`script[data-sugar-vendor="${CSS.escape(src)}"]`)
    ) {
      return true;
    }
  }

  return SHARED_CORE_TAGS.some((name) => Boolean(customElements.get(name)));
}

function reloadForCleanRegistry(tagName: string): Promise<void> {
  try {
    const prev = sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (prev === tagName) {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return Promise.reject(
        new Error(
          `Custom element conflict for "${tagName}" survived reload. Hard-refresh the tab.`,
        ),
      );
    }
    sessionStorage.setItem(RELOAD_GUARD_KEY, tagName);
  } catch {
    // sessionStorage blocked — still attempt reload
  }
  window.location.reload();
  // Page is unloading; leave the host pending.
  return new Promise<void>(() => {});
}

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
  if (customElements.get(tagName)) {
    try {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
    } catch {
      /* ignore */
    }
    return Promise.resolve();
  }

  if (hasConflictingVendor(scriptSrc, tagName)) {
    return reloadForCleanRegistry(tagName);
  }

  const cacheKey = `${scriptSrc}::${tagName}`;
  const existing = loadCache.get(cacheKey);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const finish = () => {
      if (customElements.get(tagName)) {
        try {
          sessionStorage.removeItem(RELOAD_GUARD_KEY);
        } catch {
          /* ignore */
        }
        resolve();
        return;
      }
      customElements
        .whenDefined(tagName)
        .then(() => {
          try {
            sessionStorage.removeItem(RELOAD_GUARD_KEY);
          } catch {
            /* ignore */
          }
          resolve();
        })
        .catch(reject);
    };

    const attr = "data-sugar-vendor";
    const vendorId = vendorPath(scriptSrc);
    const found = document.querySelector<HTMLScriptElement>(
      `script[${attr}="${CSS.escape(vendorId)}"]`,
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

    // Re-check right before inject (soft-nav race with the other product).
    if (hasConflictingVendor(scriptSrc, tagName)) {
      void reloadForCleanRegistry(tagName).then(resolve, reject);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = scriptSrc;
    script.async = true;
    script.setAttribute(attr, vendorId);
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
