'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface MarkdownFile {
  title: string;
  date: string;
  slug: string;
  filePath: string;
}

export default function MarkdownListPage() {
  const [markdownFiles, setMarkdownFiles] = useState<MarkdownFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMarkdownFiles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/markdown');

        if (!response.ok) {
          throw new Error('Failed to fetch markdown files');
        }

        const data = await response.json();
        setMarkdownFiles(data || []);
      } catch (err) {
        console.error('Error fetching markdown files:', err);
        setError('마크다운 파일 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdownFiles();
  }, []);

  if (loading) {
    return <div className="container mx-auto p-8">로딩 중...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">마크다운 문서 목록</h1>

      {markdownFiles.length === 0 ? (
        <p className="text-gray-500">마크다운 문서가 없습니다.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {markdownFiles.map((file) => (
            <Link
              href={`/markdown/${file.slug}`}
              key={file.slug}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-transform hover:-translate-y-1 hover:shadow-lg"
            >
              <h2 className="mb-2 text-xl font-semibold">{file.title}</h2>
              <p className="text-sm text-gray-500">
                {new Date(file.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
