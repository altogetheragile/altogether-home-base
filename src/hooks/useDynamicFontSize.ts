import { useMemo, CSSProperties } from "react";

/**
 * Dynamically calculates font sizes and inline styles for
 * title, subtitle, and content text based on input length.
 *
 * @param text string used for font sizing logic (usually block.content.title)
 */
export function useDynamicFontSize(text: string) {
  return useMemo(() => {
    const length = text?.length || 0;

    // Default sizes
    let titleSize = "text-4xl";
    let subtitleSize = "text-2xl";
    let contentSize = "text-base";

    if (length > 50 && length <= 100) {
      titleSize = "text-3xl";
    } else if (length > 100) {
      titleSize = "text-2xl";
    }

    // Inline styles for fine-grain control (optional)
    const titleStyle: CSSProperties = {
      lineHeight: "1.2",
      wordBreak: "break-word",
    };

    const subtitleStyle: CSSProperties = {
      lineHeight: "1.3",
      wordBreak: "break-word",
    };

    const contentStyle: CSSProperties = {
      lineHeight: "1.5",
      wordBreak: "break-word",
    };

    return {
      titleSize,
      subtitleSize,
      contentSize,
      titleStyle,
      subtitleStyle,
      contentStyle,
    };
  }, [text]);
}