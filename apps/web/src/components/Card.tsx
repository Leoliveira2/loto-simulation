import React from "react";
export function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">{children}</div>;
}
