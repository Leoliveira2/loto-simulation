import React from "react";
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-gray-200 px-2 py-1 text-xs">{children}</span>;
}
