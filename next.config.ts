import type { NextConfig } from 'next';
import withBundleAnalyzer from '@next/bundle-analyzer';
import withRemoveImports from 'next-remove-imports';

const removeImports = withRemoveImports();
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
});

// Next.js 16에 맞는 설정
const nextConfig: NextConfig = {
  // 빌드 오류 무시 설정
  typescript: {
    ignoreBuildErrors: true
  },
  // ESLint 빌드 시 무시 설정
  // eslint: {
  //   ignoreDuringBuilds: true,
  //   dirs: ['src']
  // },
  // Next.js 16에 최적화된 Turbopack 설정
  turbopack: {
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.mdx'],
    rules: {
      '*.api.*': ['server-only']
    }
  },

  // 성능 최적화
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true, // Gzip 압축 활성화
  productionBrowserSourceMaps: false, // 프로덕션에서 소스맵 비활성화 (번들 크기 감소)
  swcMinify: true, // SWC 미니파이어 사용 (빠른 빌드)

  // 캐싱 및 최적화 설정
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180 // 정적 페이지 캐시 3분
    },
    reactCompiler: true, // React 컴파일러 활성화 (불필요한 리렌더링 방지)
    optimizePackageImports: ['react-icons', 'framer-motion'], // 특정 패키지 최적화 임포트
    optimizeCss: true // CSS 최적화 활성화
  },

  // 이미지 최적화
  images: {
    // 이미지 포맷 최적화 (WebP, AVIF 자동 사용)
    formats: ['image/avif', 'image/webp'],
    // 이미지 캐싱 설정
    deviceSizes: [320, 420, 640, 750, 828, 1080, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 외부 도메인 설정
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
        hostname: 'opengraph.githubassets.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        port: '',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'komarev.com',
        pathname: '/**'
      }
    ]
  },

  // 웹팩 번들 분석 및 최적화
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            // React 관련 라이브러리 분리
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              priority: 10,
              reuseExistingChunk: true
            },
            // UI 라이브러리 분리
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|@radix-ui)[\\/]/,
              name: 'ui-vendor',
              priority: 9,
              reuseExistingChunk: true
            },
            // 애니메이션 라이브러리 분리 (지연 로딩)
            animation: {
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              name: 'animation-vendor',
              priority: 8,
              reuseExistingChunk: true,
              enforce: true
            },
            // 공통 라이브러리
            common: {
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    return config;
  }
};

const configWithRemoveImports = removeImports(nextConfig);
export default bundleAnalyzer(configWithRemoveImports);
