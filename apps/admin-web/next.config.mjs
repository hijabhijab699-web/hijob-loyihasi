/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@n2431/design-tokens', '@n2431/shared-types'],
  // Next's default 1 MB cap on Server Action bodies was rejecting the ad
  // banner upload with a 413 "Body exceeded 1 MB limit". Bump to 12 MB so
  // typical camera-roll JPEGs sail through; matches the API side's
  // MAX_IMAGE_BYTES guard which still enforces the hard limit.
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '**.trycloudflare.com' },
      { protocol: 'https', hostname: '**.n2431.app' },
      { protocol: 'https', hostname: 'api.2431.uz' },
    ],
  },
};

export default nextConfig;
