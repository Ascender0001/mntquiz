/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Geolocation is needed by the game (self only); block camera/mic.
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=(), interest-cohort=()'
          }
        ]
      }
    ];
  }
};

export default nextConfig;
