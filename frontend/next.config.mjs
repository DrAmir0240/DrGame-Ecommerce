/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "http://62.60.191.67:8000/api",
  },
  images: {
    domains: ["media.rawg.io", "images.unsplash.com", "via.placeholder.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      // Gamepad tester shell: never cache (prep script patches it in-place)
      {
        source: '/gamepad/index.html',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      // Gamepad assets: hashed names but content patched in-place → revalidate
      {
        source: '/gamepad/assets/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }],
      },
      // Gamepad models/fonts: immutable binaries
      {
        source: '/gamepad/models/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/gamepad/fonts/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      // Gamepad PWA icons: week-long cache
      {
        source: '/gamepad/pwa/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=604800' }],
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
