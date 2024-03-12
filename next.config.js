const removeImports = require('next-remove-imports')();
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tnmdprhjqnijsaqjvbtd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/blog-image/**'
      }
    ]
  }
};

module.exports = removeImports(nextConfig);
