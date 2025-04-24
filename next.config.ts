import type { NextConfig } from 'next';
import withRemoveImports from 'next-remove-imports';

const removeImports = withRemoveImports();

// Next.js 15에 맞는 설정
const nextConfig: NextConfig = {
  // 빌드 오류 무시 설정
  typescript: {
    ignoreBuildErrors: true
  },
  // ESLint 빌드 시 무시 설정
  eslint: {
    ignoreDuringBuilds: true
  },
  // Next.js 15에서는 turbopack이 안정화되어 최상위 설정으로 이동
  turbopack: {
    // 파일 확장자별 로더 설정
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json', '.mdx'],
    // 모듈 규칙
    rules: {
      // API 라우트는 서버에서만 실행
      '*.api.*': ['server-only']
    }
  },
  // 기타 설정
  reactStrictMode: true,
  poweredByHeader: false, // 'X-Powered-By' 헤더 제거
  // 기타 experimental 설정
  experimental: {
    // 캐시 시간 설정
    staleTimes: {
      dynamic: 30
    },
    // React 컴파일러 활성화
    reactCompiler: true
  },
  // 이미지 최적화 및 외부 도메인 설정
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
      },
      {
        protocol: 'https',
        hostname: 'komarev.com',
        pathname: '/**'
      }
    ],
    // placeholder 이미지 오류 방지를 위해 이미지 최적화 비활성화
    unoptimized: true
  }
};

export default removeImports(nextConfig);
