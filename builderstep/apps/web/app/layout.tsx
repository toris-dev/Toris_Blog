import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import RevealInit from "@/components/RevealInit";
import FxInit from "@/components/FxInit";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://builder.toris.kr"),
  title: "빌더스텝 — 혼자 만드는 제품, 다음 단계는 함께",
  description:
    "1인 개발자가 아이디어 검증부터 출시, 첫 매출, 사업 성장까지 단계적으로 나아가도록 돕는 사업화 지원 플랫폼. 현재 단계를 진단하고 다음 행동을 찾아보세요.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "빌더스텝 (BuilderStep)",
    description: "혼자 만드는 제품, 다음 단계는 함께",
    url: "https://builder.toris.kr",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "빌더스텝 — 혼자 만드는 제품, 다음 단계는 함께",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "빌더스텝 (BuilderStep)",
    description: "혼자 만드는 제품, 다음 단계는 함께",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#101419",
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
      sameAs: [
        "https://www.instagram.com/toris.kr",
        "https://github.com/torisKR",
        "https://www.linkedin.com/in/toriskorea/",
        "https://www.threads.com/@toris.kr",
        "https://play.google.com/store/apps/dev?id=6912640494861955983",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://builder.toris.kr/#website",
      url: "https://builder.toris.kr",
      name: "빌더스텝",
      inLanguage: "ko-KR",
      publisher: { "@id": "https://toris.kr/#org" },
    },
    {
      "@type": "WebApplication",
      "@id": "https://builder.toris.kr/#app",
      name: "빌더스텝",
      alternateName: "BuilderStep",
      url: "https://builder.toris.kr",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      description:
        "1인 개발자가 아이디어 검증부터 출시, 첫 매출, 사업 성장까지 단계적으로 나아가도록 돕는 사업화 지원 플랫폼.",
      publisher: { "@id": "https://toris.kr/#org" },
    },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="void">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-step focus:px-4 focus:py-2 focus:font-semibold focus:text-[#14100b]"
        >
          본문으로 건너뛰기
        </a>
        <RevealInit />
        <FxInit />
        {children}
      </body>
    </html>
  );
}
