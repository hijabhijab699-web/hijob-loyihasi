/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@n2431/design-tokens', '@n2431/shared-types'],
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '**.trycloudflare.com' },
      { protocol: 'https', hostname: '**.n2431.app' },
    ],
  },
};

export default nextConfig;
