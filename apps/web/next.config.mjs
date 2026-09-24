import path from 'node:path';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Scope next/image remote hosts (a wildcard '**' is the Image Optimizer DoS
  // advisory). Add specific hosts here as real image sources are introduced.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'wqaplkypnetifpqrungv.supabase.co' }],
  },
  // @altogether/ui is a file: dependency, so it is a symlink, and that causes two problems at
  // once. Its own import of lucide-react resolves from the package's real path - which means
  // packages/ui/node_modules and then the repository root, neither of which exists when this
  // project installs on its own, in CI and on Vercel.
  //
  // The first attempt at that was resolve.symlinks = false. It fixed resolution and broke
  // something worse: webpack then snapshots the symlink rather than its target, so a change to
  // packages/ui/dist is invisible to a build with a warm cache. The founder photograph stayed
  // missing from the live site through a deploy that contained the fix, and nothing failed.
  //
  // Looking in this project's own node_modules for bare imports solves the resolution without
  // touching how files are identified, so a changed package still invalidates the cache.
  webpack: (config) => {
    config.resolve.modules = [
      path.join(import.meta.dirname, 'node_modules'),
      ...(config.resolve.modules ?? ['node_modules']),
    ];
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
