/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@pti-calendar/design-system', '@pti-calendar/shared-types', '@pti-calendar/api-client'],
  env: { NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000' },
};
