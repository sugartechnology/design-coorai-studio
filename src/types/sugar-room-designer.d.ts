import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sugar-room-designer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "app-identifier"?: string;
          "welcome-menu"?: string;
          state?: string;
          ui?: "builtin" | "none" | string;
        },
        HTMLElement
      >;
      "sugar-model-viewer": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "product-id"?: string;
          "sugar-product-id"?: number | string;
          "company-id"?: number | string;
          ar?: boolean;
          quote?: boolean;
          download?: boolean;
          popup?: boolean;
          preload?: boolean;
        },
        HTMLElement
      >;
    }
  }
}

export {};
