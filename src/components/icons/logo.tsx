import * as React from "react";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 10a4 4 0 0 1-4-4 4 4 0 0 1 4-4" />
      <path d="M6 22a4 4 0 0 0-4-4 4 4 0 0 0 4-4" />
      <path d="M18 10a4 4 0 0 0 4-4 4 4 0 0 0-4-4" />
      <path d="M18 22a4 4 0 0 1 4-4 4 4 0 0 1-4-4" />
      <path d="M14 18v-4" />
      <path d="M10 18v-4" />
      <path d="M12 14v-4" />
      <path d="M12 6V2" />
    </svg>
  );
}
