/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@pti-calendar/design-system', '@pti-calendar/shared-types', '@pti-calendar/shared-utils', '@pti-calendar/api-client'],
  images: {
    domains: ['pti-calendar.sgs.com', 'localhost'],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
};

module.exports = nextConfig;
