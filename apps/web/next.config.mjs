/** @type {import('next').NextConfig} */
const config = {
  // output: 'export' removed — incompatible with dynamic routes ([id], [username], etc.)
  // Using server rendering proxied through combo-server
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
export default config;
