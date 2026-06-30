import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // apps/web is the Next.js app; it has its own ESLint config (eslint-config-next)
  // and is linted by `next build`. The root linter must not reach into it.
  // storybook-static is generated Storybook build output (committed for previews); like
  // dist it must not be linted — its bundled code carries eslint-disable directives for
  // rules this config does not load, which otherwise error as "rule definition not found".
  { ignores: ["dist", "apps/web/**", ".design-sync/**", "ds-bundle/**", "**/storybook-static/**"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      // Empty catch blocks are deliberate best-effort swallows here (and Sentry's global
      // handler still captures anything genuinely unhandled). Non-catch empty blocks still warn.
      "no-empty": ["warn", { "allowEmptyCatch": true }],
      "no-case-declarations": "warn",
      // React Compiler rules from react-hooks v7 — downgrade to warnings
      // These flag real patterns but need gradual migration, not blocking CI
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/refs": "warn",
    },
  }
);
