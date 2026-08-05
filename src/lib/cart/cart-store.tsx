"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { QuoteDraft, QuoteLineItem, QuoteSectionMeta } from "@/lib/offers";
import type { CartLine, CartSource, CartState } from "./types";

const STORAGE_KEY = "istikbal-portal-cart-v1";

type CartContextValue = {
  lines: CartLine[];
  section: QuoteSectionMeta | null;
  count: number;
  addLines: (
    items: QuoteLineItem[],
    source: CartSource,
    section?: QuoteSectionMeta | null,
  ) => void;
  removeLine: (id: string) => void;
  clear: () => void;
  setSection: (section: QuoteSectionMeta | null) => void;
  toQuoteDraft: (language: string) => QuoteDraft | null;
};

const CartContext = createContext<CartContextValue | null>(null);

function newLineId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readStored(): CartState {
  if (typeof window === "undefined") {
    return { lines: [], section: null };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { lines: [], section: null };
    const parsed = JSON.parse(raw) as CartState;
    if (!parsed || !Array.isArray(parsed.lines)) {
      return { lines: [], section: null };
    }
    return {
      lines: parsed.lines,
      section: parsed.section ?? null,
    };
  } catch {
    return { lines: [], section: null };
  }
}

function writeStored(state: CartState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [section, setSectionState] = useState<QuoteSectionMeta | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStored();
    setLines(stored.lines);
    setSectionState(stored.section);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStored({ lines, section });
  }, [hydrated, lines, section]);

  const addLines = useCallback(
    (
      items: QuoteLineItem[],
      source: CartSource,
      nextSection?: QuoteSectionMeta | null,
    ) => {
      if (items.length === 0) return;
      setLines((prev) => [
        ...prev,
        ...items.map((item) => ({
          ...item,
          id: newLineId(),
          source,
        })),
      ]);
      if (nextSection !== undefined) {
        setSectionState((prev) => {
          if (!nextSection) return prev;
          if (!prev) return nextSection;
          return {
            ...prev,
            ...nextSection,
            images:
              nextSection.images && nextSection.images.length > 0
                ? nextSection.images
                : prev.images,
            sceneLayout: nextSection.sceneLayout ?? prev.sceneLayout,
            promptNotes: nextSection.promptNotes ?? prev.promptNotes,
            roomType: nextSection.roomType ?? prev.roomType,
            name: nextSection.name || prev.name,
          };
        });
      }
    },
    [],
  );

  const removeLine = useCallback((id: string) => {
    setLines((prev) => {
      const next = prev.filter((line) => line.id !== id);
      if (next.length === 0) setSectionState(null);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    setSectionState(null);
  }, []);

  const setSection = useCallback((next: QuoteSectionMeta | null) => {
    setSectionState(next);
  }, []);

  const toQuoteDraft = useCallback(
    (language: string): QuoteDraft | null => {
      if (lines.length === 0) return null;
      const currency = lines[0]?.currency || "TRY";
      const draftLines: QuoteLineItem[] = lines.map(
        ({ id: _id, source: _source, ...line }) => line,
      );
      return {
        title: section?.name || draftLines[0]?.name || "Sepet",
        currency,
        language,
        section: section ?? {
          name: draftLines.length === 1 ? draftLines[0].name : "Sepet",
        },
        lines: draftLines,
      };
    },
    [lines, section],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      section,
      count: lines.reduce((sum, line) => sum + (line.quantity || 1), 0),
      addLines,
      removeLine,
      clear,
      setSection,
      toQuoteDraft,
    }),
    [
      lines,
      section,
      addLines,
      removeLine,
      clear,
      setSection,
      toQuoteDraft,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}
