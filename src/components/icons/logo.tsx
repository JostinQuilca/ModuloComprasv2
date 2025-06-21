import * as React from "react";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12.5 3H7.8C7.11 3 6.5 3.61 6.5 4.3V19.7C6.5 20.39 7.11 21 7.8 21H12.5C16.37 21 19.5 17.87 19.5 14C19.5 10.13 16.37 7 12.5 7H9.5V11H12.5C14.16 11 15.5 12.34 15.5 14C15.5 15.66 14.16 17 12.5 17H9.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
