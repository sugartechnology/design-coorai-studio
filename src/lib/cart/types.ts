import type { QuoteLineItem, QuoteSectionMeta } from "@/lib/offers";

export type CartSource = "kumas" | "oda" | "ai";

export type CartLine = QuoteLineItem & {
  id: string;
  source: CartSource;
};

export type CartState = {
  lines: CartLine[];
  section: QuoteSectionMeta | null;
};
