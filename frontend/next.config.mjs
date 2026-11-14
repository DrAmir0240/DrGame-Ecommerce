let withBundleAnalyzer = (config) => config;
if (process.env.ANALYZE === 'true') {
  try {
    const { default: withBundleAnalyzerFactory } = await import('@next/bundle-analyzer');
    withBundleAnalyzer = withBundleAnalyzerFactory({
      enabled: true,
    });
  } catch {
    // Optional dev tool: ignore if not installed in production/dev container
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  swcMinify: true,

  // Prevent build hang-ups trying to scrape remote Google Fonts in restricted networks
  optimizeFonts: false,

  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] }
        : false,
  },

  experimental: {
    // Tree-shake large packages automatically to produce ultra-lean client chunks
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'three',
      'clsx',
      'tailwind-merge',
      'zustand',
      'i18next',
      'react-i18next',
    ],
  },

  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.gamedr.ir/api',
  },

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
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

  async headers() {
    return [
      // DualSense and 3D models (~12 MB) cached permanently
      {
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Static assets long-lived cache
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // SVGs, public icons and media
      {
        source: '/(bg-pattern-dark.svg|logo.png|favicon.ico)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
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

export default withBundleAnalyzer(nextConfig);
