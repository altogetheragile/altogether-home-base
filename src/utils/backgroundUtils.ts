// src/utils/backgroundUtils.ts

/**
 * Returns a height class for a block based on style and type.
 */
export const getHeightClass = (
  height: string | undefined,
  blockType: string
): string => {
  if (!height) return "min-h-[200px]"; // default fallback

  switch (height) {
    case "full":
      return "min-h-screen";
    case "half":
      return "min-h-[50vh]";
    case "auto":
      return "h-auto";
    default:
      return "min-h-[200px]";
  }
};

/**
 * Returns inline background styles for a block.
 */
export const getBackgroundStyles = (
  styles: Record<string, any> = {}
): React.CSSProperties => {
  const backgroundStyles: React.CSSProperties = {};

  if (styles.backgroundImage) {
    backgroundStyles.backgroundImage = `url(${styles.backgroundImage})`;
    backgroundStyles.backgroundSize = styles.backgroundSize || "cover";
    backgroundStyles.backgroundPosition = styles.backgroundPosition || "center";
  }

  if (styles.backgroundColor) {
    backgroundStyles.backgroundColor = styles.backgroundColor;
  }

  return backgroundStyles;
};

/**
 * Returns inline styles for font/content.
 */
export const getInlineStyles = (
  styles: Record<string, any> = {}
): React.CSSProperties => {
  return {
    ...(styles.fontSize ? { fontSize: styles.fontSize } : {}),
    ...(styles.fontWeight ? { fontWeight: styles.fontWeight } : {}),
    ...(styles.color ? { color: styles.color } : {}),
    ...(styles.lineHeight ? { lineHeight: styles.lineHeight } : {}),
    ...(styles.letterSpacing ? { letterSpacing: styles.letterSpacing } : {}),
  };
};

/**
 * Returns Tailwind class names for alignment/spacing/etc.
 */
export const getStyleClasses = (styles: Record<string, any> = {}): string => {
  const classes: string[] = [];

  if (styles.textAlign) {
    switch (styles.textAlign) {
      case "left":
        classes.push("text-left");
        break;
      case "center":
        classes.push("text-center");
        break;
      case "right":
        classes.push("text-right");
        break;
    }
  }

  if (styles.padding) {
    classes.push(styles.padding); // e.g. "p-4"
  }

  if (styles.margin) {
    classes.push(styles.margin); // e.g. "mb-6"
  }

  return classes.join(" ");
};