/**
 * Altogether Agile brand tokens — the single source of truth for colour, type,
 * radius and spacing across both surfaces (the Next.js Site and the Vite App) and
 * the source the Claude Design sync consumes.
 */
declare const colors: {
    readonly white: "#FFFFFF";
    readonly skyTeal: "#F0FAFA";
    readonly paleTeal: "#D9F2F2";
    readonly lightTeal: "#B2DFDF";
    readonly midTeal: "#007A7A";
    readonly deepTeal: "#004D4D";
    /** A teal between mid and deep used for hero/strip backgrounds. */
    readonly heroTeal: "#006666";
    readonly orange: "#FF9715";
    readonly orangeHover: "#E6870E";
    readonly body: "#374151";
    readonly muted: "#6B7280";
    readonly danger: "#DC2626";
};
declare const fonts: {
    readonly serif: "'DM Serif Display', Georgia, serif";
    readonly sans: "'DM Sans', system-ui, sans-serif";
    /** The Vite App's historical body font. */
    readonly ui: "'Segoe UI', system-ui, sans-serif";
};
declare const radii: {
    readonly sm: 8;
    readonly md: 10;
    readonly lg: 14;
    readonly xl: 16;
    readonly pill: 9999;
};
/** 4px base spacing scale. `space(4)` = 16px. */
declare const space: (n: number) => number;
declare const fontWeights: {
    readonly regular: 400;
    readonly medium: 500;
    readonly semibold: 600;
    readonly bold: 700;
    readonly heavy: 800;
};
type ColorToken = keyof typeof colors;
/** All tokens under one namespace, handy for spreading into a theme object. */
declare const tokens: {
    readonly colors: {
        readonly white: "#FFFFFF";
        readonly skyTeal: "#F0FAFA";
        readonly paleTeal: "#D9F2F2";
        readonly lightTeal: "#B2DFDF";
        readonly midTeal: "#007A7A";
        readonly deepTeal: "#004D4D";
        /** A teal between mid and deep used for hero/strip backgrounds. */
        readonly heroTeal: "#006666";
        readonly orange: "#FF9715";
        readonly orangeHover: "#E6870E";
        readonly body: "#374151";
        readonly muted: "#6B7280";
        readonly danger: "#DC2626";
    };
    readonly fonts: {
        readonly serif: "'DM Serif Display', Georgia, serif";
        readonly sans: "'DM Sans', system-ui, sans-serif";
        /** The Vite App's historical body font. */
        readonly ui: "'Segoe UI', system-ui, sans-serif";
    };
    readonly radii: {
        readonly sm: 8;
        readonly md: 10;
        readonly lg: 14;
        readonly xl: 16;
        readonly pill: 9999;
    };
    readonly fontWeights: {
        readonly regular: 400;
        readonly medium: 500;
        readonly semibold: 600;
        readonly bold: 700;
        readonly heavy: 800;
    };
    readonly space: (n: number) => number;
};

export { type ColorToken, colors, fontWeights, fonts, radii, space, tokens };
