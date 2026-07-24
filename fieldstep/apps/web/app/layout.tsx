import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://field.toris.kr"),
  title: "현장완료 — 작업완료보고서와 청구 준비 자동화",
  description:
    "산업설비·공조 유지보수팀을 위한 작업완료보고 자동화. 현장 사진과 메모를 완료보고서로 정리하고 고객 승인부터 청구 가능 상태까지 연결합니다.",
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  applicationName: "현장완료",
  appleWebApp: {
    capable: true,
    title: "현장완료",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/icon-192.png"],
  },
  openGraph: {
    url: "/",
    title: "현장완료 — 현장이 끝나면, 보고와 청구 준비도 끝나야 합니다",
    description:
      "현장 기록을 완료보고서로 정리하고 고객 승인부터 청구 가능 상태까지 연결합니다.",
    type: "website",
    locale: "ko_KR",
    images: [
      {
        url: "/images/field-hero.webp",
        width: 1536,
        height: 1024,
        alt: "산업설비 현장에서 작업 결과를 기록하는 현장완료 데모 이미지",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "현장완료 — 작업완료보고서와 청구 준비 자동화",
    description: "현장 기록부터 고객 승인, 청구 가능 상태까지 한 건의 흐름으로 연결합니다.",
    images: ["/images/field-hero.webp"],
  },
};

export const viewport: Viewport = {
  themeColor: "#11151b",
};

// AI·검색 엔진 엔티티 인식용 구조화 데이터 (GEO)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://toris.kr/#org",
      name: "토리스 (Toris)",
      url: "https://toris.kr",
    },
    {
      "@type": "WebSite",
      "@id": "https://field.toris.kr/#website",
      url: "https://field.toris.kr",
      name: "현장완료",
      inLanguage: "ko-KR",
      publisher: { "@id": "https://toris.kr/#org" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://field.toris.kr/#app",
      name: "현장완료",
      alternateName: "FieldStep",
      url: "https://field.toris.kr",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      description:
        "산업설비·공조 유지보수팀을 위한 작업완료보고 자동화. 현장 기록을 완료보고서로 정리하고 고객 승인부터 청구 가능 상태까지 연결합니다.",
      publisher: { "@id": "https://toris.kr/#org" },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#page-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          본문으로 건너뛰기
        </a>
        <AuthProvider>
          <div id="page-content" tabIndex={-1}>
            {children}
          </div>
        </AuthProvider>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
