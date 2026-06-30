import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { sentryVitePlugin } from "@sentry/vite-plugin";

/** Make CSS non-render-blocking so the critical HTML shell paints instantly. */
function deferCssPlugin(): Plugin {
  return {
    name: 'defer-css',
    enforce: 'post',
    transformIndexHtml(html) {
      // Convert <link rel="stylesheet" ...> to async pattern
      return html.replace(
        /<link rel="stylesheet" crossorigin href="(\/assets\/[^"]+\.css)">/g,
        '<link rel="preload" as="style" href="$1" crossorigin onload="this.onload=null;this.rel=\'stylesheet\'">' +
        '<noscript><link rel="stylesheet" crossorigin href="$1"></noscript>'
      );
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    mode === 'production' && deferCssPlugin(),
    // Upload source maps to Sentry so production stack traces show real code.
    // Only runs when the build-time auth token is present (the Vercel production
    // build); skipped locally and in PRs, so those builds are unchanged. Must be
    // last so it sees the final bundle.
    !!process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      // Delete the .map files from dist after upload so they are never served to
      // browsers (the maps live only in Sentry).
      sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Generate hidden source maps only when uploading to Sentry (token present).
    // "hidden" means no //# sourceMappingURL comment in the shipped JS, so browsers
    // never fetch them; Sentry still gets them via the plugin above.
    sourcemap: process.env.SENTRY_AUTH_TOKEN ? 'hidden' : false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
          ],
          // Heavy libraries omitted from manualChunks so Vite loads them
          // lazily via their route-level code splits instead of preloading
          // them in <head> on every page visit.
        },
      },
    },
  },
}));
