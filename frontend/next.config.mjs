/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://api.gamedr.ir/api",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/hub',
        permanent: false,
      },
      {
        source: '/admin/dashboard',
        destination: '/admin/hub',
        permanent: false,
      },
      {
        source: '/admin/login',
        destination: '/admin/hub',
        permanent: false,
      },
    ];
  },

  // The DualSense glb is ~12 MB — cache it hard so the tester loads instantly
  // on repeat visits.
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  webpack: (config, { dev }) => {
    // Only use polling if running in Docker/WSL where filesystem events don't pass through
    if (dev && process.env.WATCHPACK_POLLING === 'true') {
      config.watchOptions = {
        poll: 800,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
