'use client';

import MarkdownEditor from '@/components/admin/MarkdownEditor';
import Loading from '@/components/common/Loading';
import { FaArrowLeft } from '@/components/icons';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditPost({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [post, setPost] = useState<{
    content: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        const response = await fetch(`/api/markdown/${params.slug}`);
        console.log(response);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || '게시글을 불러오는데 실패했습니다.'
          );
        }

        const postData = await response.json();
        setPost(postData);
      } catch (err) {
        console.error('게시글 로딩 오류:', err);
        setError(
          err instanceof Error
            ? err.message
            : '게시글을 불러오는데 실패했습니다.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      fetchPost();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-3xl px-4">
        <div className="mb-6 flex items-center">
          <Button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-sm"
          >
            <FaArrowLeft className="size-3" />
            <span>돌아가기</span>
          </Button>
        </div>

        <div className="rounded-lg bg-red-50 p-6 text-center text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <h1 className="mb-2 text-xl font-bold">오류 발생</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto mt-12 max-w-3xl px-4">
        <div className="mb-6 flex items-center">
          <Button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm"
          >
            <FaArrowLeft className="size-3" />
            <span>돌아가기</span>
          </Button>
        </div>

        <div className="rounded-lg bg-yellow-50 p-6 text-center text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
          <h1 className="mb-2 text-xl font-bold">게시글 없음</h1>
          <p>수정할 게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Button
          type="button"
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 text-sm"
        >
          <FaArrowLeft className="size-3" />
          <span>대시보드로 돌아가기</span>
        </Button>
        <h1 className="ml-4 text-xl font-bold text-gray-800 dark:text-white">
          게시글 수정: {params.slug}
        </h1>
      </div>

      <MarkdownEditor
        defaultContent={post.content}
        mode="edit"
        fileName={post.fileName}
        slug={params.slug}
      />
    </div>
  );
}
