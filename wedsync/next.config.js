/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ['@wedsync/ui', '@wedsync/types', '@wedsync/utils'],
}

module.exports = nextConfig