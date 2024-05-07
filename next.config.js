const removeImports = require('next-remove-imports')();
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tnmdprhjqnijsaqjvbtd.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/blog-image/**'
      },
      {
        protocol: 'https',
        hostname: 'oopy.lazyrockets.com',
        port: '',
        pathname: '/api/v2/notion/**'
      },
      {
        protocol: 'https',
        hostname: 'img1.daumcdn.net',
        port: '',
        pathname: '/thumb/**'
      }
    ]
  }
};

module.exports = removeImports(nextConfig);
