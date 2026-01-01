"use client";
import React from "react";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" }) {
  const { variant = "primary", className = "", ...rest } = props;
  const base = "px-4 py-2 rounded-xl text-sm font-medium transition border focus:outline-none focus:ring-2 focus:ring-offset-2";
  const styles = variant === "primary"
    ? "bg-black text-white border-black hover:opacity-90"
    : "bg-white text-black border-gray-200 hover:bg-gray-50";
  return <button className={`${base} ${styles} ${className}`} {...rest} />;
}
