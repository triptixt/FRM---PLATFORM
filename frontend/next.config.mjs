/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8081';
    return [
      {
        source: '/frm/:path*',
        destination: `${backendUrl}/frm/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${backendUrl}/auth/:path*`,
      },
      {
        source: '/admin/:path*',
        destination: `${backendUrl}/admin/:path*`,
      },
      {
        source: '/debug/:path*',
        destination: `${backendUrl}/debug/:path*`,
      },
    ];
  },
};

export default nextConfig;

