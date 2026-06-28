/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Scope next/image remote hosts (a wildcard '**' is the Image Optimizer DoS
  // advisory). Add specific hosts here as real image sources are introduced.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'wqaplkypnetifpqrungv.supabase.co' }],
  },
};

export default nextConfig;
