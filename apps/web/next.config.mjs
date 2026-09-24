import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Scope next/image remote hosts (a wildcard '**' is the Image Optimizer DoS
  // advisory). Add specific hosts here as real image sources are introduced.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'wqaplkypnetifpqrungv.supabase.co' }],
  },
  // @altogether/ui is a file: dependency, so it is a symlink. Webpack resolves a symlinked file
  // to its real path and then looks for that file's imports from THERE, which means
  // packages/ui/node_modules and then the repository root. This project installs on its own, both
  // in CI and on Vercel, so neither of those exists: the package's import of lucide-react
  // resolved to nothing and the build failed with "Can't resolve 'lucide-react'".
  //
  // Not resolving symlinks keeps resolution inside this project's own node_modules, where
  // lucide-react is a direct dependency. It also guarantees one copy of React rather than two,
  // which is the other thing that goes wrong with linked packages.
  webpack: (config) => {
    config.resolve.symlinks = false;
    return config;
  },
};

// Only wrap with Sentry when a DSN is configured. Until NEXT_PUBLIC_SENTRY_DSN is set in
// the environment the exported config is the plain nextConfig, so the live build is
// byte-identical and error monitoring stays dormant (zero risk pre-activation).
const sentryEnabled = !!process.env.NEXT_PUBLIC_SENTRY_DSN;

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      // Source-map upload runs only when these are present (set in Vercel/CI). Without
      // SENTRY_AUTH_TOKEN the build still succeeds; it just skips the upload step.
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      disableLogger: true,
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
      },
    })
  : nextConfig;
