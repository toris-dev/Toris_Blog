import ContactForm from '@/components/forms/ContactForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '연락하기 - toris-dev',
  description:
    '풀스택 개발자 toris-dev에게 연락하세요. 프로젝트 문의, 협업 제안 등을 기다립니다.'
};

export const dynamic = 'force-dynamic';

// 서버 컴포넌트 (기본 내보내기)
export default function ContactPage() {
  return <ContactForm />;
}
