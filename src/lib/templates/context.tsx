"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PortalTemplate } from "@/lib/templates/schema";

const PortalTemplateContext = createContext<PortalTemplate | null>(null);

export function PortalTemplateProvider({
  template,
  children,
}: {
  template: PortalTemplate;
  children: ReactNode;
}) {
  return (
    <PortalTemplateContext.Provider value={template}>
      {children}
    </PortalTemplateContext.Provider>
  );
}

export function usePortalTemplate(): PortalTemplate {
  const value = useContext(PortalTemplateContext);
  if (!value) {
    throw new Error("usePortalTemplate must be used within PortalTemplateProvider");
  }
  return value;
}
