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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
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
