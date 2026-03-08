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
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:3333/api/v1/:path*',
      },
    ];
  },
};
export default config;
