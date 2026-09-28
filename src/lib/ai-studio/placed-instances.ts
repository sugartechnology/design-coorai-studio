export type PlacedIdentity = {
  uid: string;
  productId: string;
  x: number;
  y: number;
};

export function placedCountOf<T>(items: T[], matches: (item: T) => boolean): number {
  return items.filter(matches).length;
}

/**
 * A sidebar drop adds one new instance at the drop point until `quantity`
 * instances of that product are on the canvas. An existing copy is never moved.
 */
export function appendDroppedInstance<T>(
  items: T[],
  matches: (item: T) => boolean,
  quantity: number,
  create: () => T,
): T[] {
  if (quantity <= 0) return items;
  if (placedCountOf(items, matches) >= quantity) return items;
  return [...items, create()];
}

/** Canvas copies to remove when the sidebar quantity drops below what is placed. */
export function excessPlacedCount(placedCount: number, nextQuantity: number): number {
  const allowed = nextQuantity > 0 ? nextQuantity : 0;
  return Math.max(0, placedCount - allowed);
}
