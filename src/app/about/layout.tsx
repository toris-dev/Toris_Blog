import StructuredData from '@/components/seo/StructuredData';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '소개 - 풀스택 웹 개발자 토리스',
  description:
    '풀스택 웹 개발자 토리스를 소개합니다. React, Next.js, TypeScript, Node.js를 주력으로 하는 개발자의 경력, 기술 스택, 프로젝트 경험을 확인하세요.',
  keywords: [
    '토리스',
    '소개',
    '개발자 소개',
    '풀스택 개발자',
    '웹 개발자',
    'React 개발자',
    'Next.js 개발자',
    'TypeScript 개발자',
    'JavaScript 개발자',
    '프론트엔드 개발자',
    '백엔드 개발자',
    'toris-dev'
  ],
  openGraph: {
    title: '소개 - 풀스택 웹 개발자 토리스',
    description:
      '풀스택 웹 개발자 토리스를 소개합니다. React, Next.js, TypeScript, Node.js를 주력으로 하는 개발자의 경력, 기술 스택, 프로젝트 경험을 확인하세요.',
    type: 'profile',
    url: '/about'
  },
  twitter: {
    card: 'summary_large_image',
    title: '소개 - 풀스택 웹 개발자 토리스',
    description:
      '풀스택 웹 개발자 토리스를 소개합니다. React, Next.js, TypeScript, Node.js를 주력으로 하는 개발자의 경력, 기술 스택, 프로젝트 경험을 확인하세요.'
  },
  alternates: {
    canonical: '/about'
  }
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StructuredData type="person" />
      {children}
    </>
  );
}
