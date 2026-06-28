/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Blog/course featured images and external badge images come from various hosts;
  // allow remote images over https (tighten to specific hosts as they are known).
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
};

export default nextConfig;
