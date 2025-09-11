// src/lib/safe.tsx
import React from "react";

export function textOrEmpty(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number") return String(v);
  // Never leak objects into JSX text nodes
  return "";
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Safe render for text content nodes (headings, labels, etc.)
export const SafeText: React.FC<{ value: unknown; as?: keyof JSX.IntrinsicElements; className?: string }> = ({ value, as = "span", className }) => {
  const Comp: any = as;
  const txt = textOrEmpty(value);
  if (!txt) return null;
  return <Comp className={className}>{txt}</Comp>;
};

// Debug-only pretty print (never for production UI text nodes)
export const DebugObject: React.FC<{ value: unknown }> = ({ value }) => {
  if (process.env.NODE_ENV === "production") return null;
  return (
    <pre className="mt-2 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
};