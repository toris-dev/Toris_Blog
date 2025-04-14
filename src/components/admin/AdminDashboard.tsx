'use client';

import { useRouter } from 'next/navigation';
import { FC } from 'react';
import Button from '../ui/Button';

type AdminDashboardProps = {
  username: string;
};

const AdminDashboard: FC<AdminDashboardProps> = ({ username }) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST'
      });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="mb-8">
        <b>{username}</b>님으로 로그인하셨습니다.
      </div>
      <Button type="button" onClick={() => router.push('/write')}>
        마크다운 글 작성하기
      </Button>
      <Button type="button" onClick={() => router.push('/markdown')}>
        마크다운 글 목록 보기
      </Button>
      <Button type="button" onClick={handleLogout}>
        로그아웃
      </Button>
    </div>
  );
};

export default AdminDashboard;
