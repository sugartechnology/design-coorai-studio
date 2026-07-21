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
    }
  }
}

export {};
