/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["media.rawg.io", "localhost"],
    unoptimized: true,
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
