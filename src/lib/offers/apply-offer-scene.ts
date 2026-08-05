/**
 * Restore an offer room onto the designer without `scene.import`
 * (warm import wipes the scene via stateSlices applyDocument).
 *
 * Layout: planarGraph specs → scene.applyShape
 * Products: product.add + instance transform
 */

export const ROOM_DESIGNER_LAST_SCENE_KEY =
  "sugartech:room-designer:last-scene:v1";

export function clearRoomDesignerLastScene(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(ROOM_DESIGNER_LAST_SCENE_KEY);
  } catch {
    // ignore
  }
}

export type OfferSceneHost = {
  api?: {
    execute: (name: string, request: unknown) => unknown;
  };
  addProduct: (payload: {
    productId?: number;
    product?: unknown;
  }) => Promise<unknown>;
  applyRoomShape?: (
    shape: string | { specs: unknown[] } | { shape: unknown },
  ) => void;
  newScene?: () => Promise<void>;
};

export type ApplyOfferSceneResult = {
  planarSpecCount: number;
  productsAdded: number;
  productsSkipped: number;
};

type Vec3 = { x?: number; y?: number; z?: number };

type ProductInstance = {
  model?: unknown;
  position?: Vec3;
  rotation?: Vec3;
};

type SceneProduct = { id?: unknown; productId?: unknown };

function extractPlanarSpecs(scene: Record<string, unknown>): unknown[] {
  const slices = scene.stateSlices;
  if (!slices || typeof slices !== "object" || Array.isArray(slices)) {
    return [];
  }
  for (const slice of Object.values(slices as Record<string, unknown>)) {
    if (!slice || typeof slice !== "object") continue;
    if ((slice as { kind?: string }).kind !== "planarGraph") continue;
    const value = (slice as { value?: unknown }).value;
    if (Array.isArray(value) && value.length > 0) return value;
    if (value && typeof value === "object") {
      const specs = (value as { specs?: unknown }).specs;
      if (Array.isArray(specs) && specs.length > 0) return specs;
    }
  }
  return [];
}

function findProduct(
  products: SceneProduct[],
  modelId: unknown,
): SceneProduct | undefined {
  return products.find(
    (item) => item?.id == modelId || item?.productId == modelId,
  );
}

function applyInstanceTransform(
  model: unknown,
  instance: ProductInstance,
): void {
  if (!model || typeof model !== "object") return;
  const m = model as {
    position?: { set: (x: number, y: number, z: number) => void };
    rotation?: { set: (x: number, y: number, z: number) => void };
    updateMatrixWorld?: (force?: boolean) => void;
  };
  const p = instance.position;
  if (m.position?.set && p) {
    m.position.set(Number(p.x) || 0, Number(p.y) || 0, Number(p.z) || 0);
  }
  const r = instance.rotation;
  if (m.rotation?.set && r) {
    m.rotation.set(Number(r.x) || 0, Number(r.y) || 0, Number(r.z) || 0);
  }
  m.updateMatrixWorld?.(true);
}

export async function applyOfferSceneToDesigner(
  host: OfferSceneHost,
  parsed: unknown,
): Promise<ApplyOfferSceneResult> {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid scene payload");
  }
  const scene = parsed as Record<string, unknown>;
  const api = host.api;
  if (!api) throw new Error("Designer api not ready");

  clearRoomDesignerLastScene();

  try {
    await Promise.resolve(api.execute("scene.clear", undefined));
  } catch {
    await host.newScene?.();
  }

  const specs = extractPlanarSpecs(scene);
  if (specs.length > 0) {
    if (host.applyRoomShape) {
      host.applyRoomShape({ specs });
    } else {
      api.execute("scene.applyShape", { specs });
    }
  }

  const products = Array.isArray(scene.products)
    ? (scene.products as SceneProduct[])
    : [];
  const instances = Array.isArray(scene.productInstances)
    ? (scene.productInstances as ProductInstance[])
    : [];

  let productsAdded = 0;
  let productsSkipped = 0;

  for (const instance of instances) {
    const product = findProduct(products, instance.model);
    if (!product) {
      productsSkipped += 1;
      continue;
    }
    const model = await host.addProduct({ product });
    applyInstanceTransform(model, instance);
    productsAdded += 1;
  }

  clearRoomDesignerLastScene();

  return {
    planarSpecCount: specs.length,
    productsAdded,
    productsSkipped,
  };
}
