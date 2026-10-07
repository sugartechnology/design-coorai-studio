import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "sugar-configurator": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          "configurator-id"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export {};
