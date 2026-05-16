/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    reactCompiler: false,
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
