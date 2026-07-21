export type Part = {
  slug: string;
  name: string;
  regions: number;
  silhouette: "uclu" | "ikili" | "tekli" | "berjer" | "puf";
};

/** Placeholder parts until product-in-collection CRM wiring. */
export const parts: Part[] = [
  { slug: "uclu-koltuk", name: "Üçlü Koltuk", regions: 4, silhouette: "uclu" },
  { slug: "ikili-koltuk", name: "İkili Koltuk", regions: 4, silhouette: "ikili" },
  { slug: "tekli-koltuk", name: "Tekli Koltuk", regions: 3, silhouette: "tekli" },
  { slug: "berjer", name: "Berjer", regions: 3, silhouette: "berjer" },
  { slug: "puf", name: "Puf", regions: 2, silhouette: "puf" },
];
