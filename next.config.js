const removeImports = require('next-remove-imports')();
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 빌드 오류 무시 설정
  typescript: {
    ignoreBuildErrors: true
  },
  // ESLint 빌드 시 무시 설정
  eslint: {
    ignoreDuringBuilds: true
  },
  // 웹팩 설정 추가
  webpack: (config, { dev, isServer }) => {
    // Babel 경고 메시지 출력 감소를 위한 설정
    config.optimization = {
      ...config.optimization,
      moduleIds: 'named'
    };

    // 웹팩 캐시 설정 추가
    if (dev) {
      config.cache = {
        ...config.cache,
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.next/cache'),
        name: isServer ? 'server' : 'client',
        buildDependencies: {
          config: [__filename]
        }
      };
    }

    return config;
  },
  // 기타 설정
  reactStrictMode: true,
  swcMinify: true, // SWC 최적화 사용
  poweredByHeader: false, // 'X-Powered-By' 헤더 제거
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
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        port: '',
        pathname: '/toris-dev.png'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**'
      }
    ],
    // domains 속성 제거 (remotePatterns으로 대체)
    unoptimized: true // placeholder 이미지 오류 방지를 위해 이미지 최적화 비활성화
  }
};

module.exports = removeImports(nextConfig);
