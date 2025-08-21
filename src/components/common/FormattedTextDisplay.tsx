import React from "react";
import { cn } from "@/lib/utils";

type TextInput = string | string[] | null | undefined;

function normalizeToItems(input: TextInput): string[] {
  if (Array.isArray(input)) {
    return input.map(s => (s ?? "").toString().trim()).filter(Boolean);
  }
  if (typeof input !== "string") return [];

  const raw = input.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  // Primary split by lines; strip a single leading bullet if present
  let items = raw
    .split("\n")
    .map(line => line.replace(/^\s*[-*•]\s?/, "").trim())
    .filter(Boolean);

  // Fallback: sometimes models return a single line with bullets/semicolons
  if (items.length === 0) {
    items = raw
      .split(/[\u2022;]+/g) // \u2022 = •
      .map(s => s.trim())
      .filter(Boolean);
  }

  return items;
}

export interface FormattedTextDisplayProps {
  text?: TextInput;
  className?: string;
  as?: "ul" | "ol" | "p";
  debugKey?: string; // helpful to identify the section in console
}

export default function FormattedTextDisplay({
  text,
  className,
  as = "ul",
  debugKey,
}: FormattedTextDisplayProps) {
  const items = normalizeToItems(text);

  if (process.env.NODE_ENV !== "production") {
    console.debug("[FormattedTextDisplay] debugKey:", debugKey);
    console.debug("[FormattedTextDisplay] input:", text);
    console.debug("[FormattedTextDisplay] normalized items:", items);
  }

  // If we have items, render a list
  if (items.length > 0 && (as === "ul" || as === "ol")) {
    const ListTag = as;
    return (
      <ListTag
        role="list"
        className={cn("list-disc pl-5 space-y-1 leading-relaxed", className)}
      >
        {items.map((item, idx) => (
          <li key={`${debugKey ?? "item"}-${idx}`}>{item}</li>
        ))}
      </ListTag>
    );
  }

  // Fallback: render raw text (preserve newlines) so nothing is silently lost
  return (
    <p className={cn("whitespace-pre-wrap leading-relaxed", className)}>
      {typeof text === "string" ? text : ""}
    </p>
  );
}