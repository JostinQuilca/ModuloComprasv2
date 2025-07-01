import * as React from "react";
import { ShoppingCart } from "lucide-react";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return <ShoppingCart {...props} />;
}
