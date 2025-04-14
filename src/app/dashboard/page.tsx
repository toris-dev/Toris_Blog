'use client';

import AdminDashboard from '@/components/AdminDashboard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('관리자');
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();

        setIsAuthenticated(data.authenticated);

        if (!data.authenticated) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="container flex flex-col items-center justify-center px-4 py-12">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="container flex flex-col px-4 pb-20 pt-12">
      <h1 className="mb-8 text-2xl font-medium">관리자 대시보드</h1>
      <AdminDashboard username={username} />
    </div>
  );
}
