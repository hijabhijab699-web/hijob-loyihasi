/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Production API domain — serves product covers, style-render
      // results, mannequin templates and user uploads under /uploads/*.
      // Must stay first so a missing env var in a preview deploy still
      // renders production images.
      { protocol: 'https', hostname: 'api.2431.uz' },
      { protocol: 'https', hostname: '2431.uz' },
      { protocol: 'https', hostname: 'www.2431.uz' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'images.pexels.com' },
      { protocol: 'https', hostname: '**.trycloudflare.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
  },
};

export default nextConfig;
