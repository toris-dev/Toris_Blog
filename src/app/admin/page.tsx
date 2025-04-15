import { redirect } from 'next/navigation';

export default function Admin() {
  // 로그인 페이지로 리다이렉트
  // 마크다운 시스템에서는 바로 /signin 페이지로 안내
  redirect('/signin');
}

export const dynamic = 'force-dynamic';
