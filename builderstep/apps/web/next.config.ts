import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // builder.toris.kr — Cloudflare Workers Static Assets로 서빙되는 정적 export
  output: "export",
  // 워크스페이스 TS 패키지(.js 확장 ESM 임포트) 트랜스파일
  transpilePackages: ["@builderstep/shared"],
  webpack: (config) => {
    config.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return config;
  },
  // 모노레포 루트를 명시해 상위 디렉토리의 무관한 lockfile 오탐을 방지한다.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
