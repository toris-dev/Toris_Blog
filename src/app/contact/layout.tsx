import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '연락하기 - 토리스에게 메시지 보내기',
  description:
    '토리스에게 직접 연락하세요. 프로젝트 협업, 기술 문의, 또는 일반적인 질문이 있으시면 언제든지 메시지를 보내주세요.',
  keywords: [
    '연락하기',
    '컨택트',
    '메시지',
    '문의',
    '협업',
    '프로젝트',
    '토리스',
    '웹 개발자',
    '개발 문의'
  ],
  openGraph: {
    title: '연락하기 - 토리스에게 메시지 보내기',
    description:
      '토리스에게 직접 연락하세요. 프로젝트 협업, 기술 문의, 또는 일반적인 질문이 있으시면 언제든지 메시지를 보내주세요.',
    type: 'website',
    url: '/contact'
  },
  twitter: {
    card: 'summary',
    title: '연락하기 - 토리스에게 메시지 보내기',
    description:
      '토리스에게 직접 연락하세요. 프로젝트 협업, 기술 문의, 또는 일반적인 질문이 있으시면 언제든지 메시지를 보내주세요.'
  },
  alternates: {
    canonical: '/contact'
  }
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
