'use client';

import { FaSave, FaTimes } from '@/components/icons';
import Button from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { FC, useEffect, useState } from 'react';

interface MarkdownEditorProps {
  defaultContent: string;
  mode: 'create' | 'edit';
  fileName?: string;
  slug?: string;
}

const MarkdownEditor: FC<MarkdownEditorProps> = ({
  defaultContent = '',
  mode = 'create',
  fileName,
  slug
}) => {
  const router = useRouter();
  const [content, setContent] = useState(defaultContent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setContent(defaultContent);
  }, [defaultContent]);

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);
      setSaving(true);

      if (!content.trim()) {
        setError('내용을 입력해주세요.');
        return;
      }

      let response;

      if (mode === 'edit' && fileName && slug) {
        // 수정 모드
        response = await fetch(`/api/markdown/${slug}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content,
            fileName
          })
        });
      } else {
        // 생성 모드 (기존 /write 페이지에서 처리)
        response = await fetch('/api/markdown', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content
          })
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '저장 중 오류가 발생했습니다.');
      }

      setSuccess(
        mode === 'edit'
          ? '게시글이 업데이트되었습니다.'
          : '게시글이 저장되었습니다.'
      );

      // 편집 모드에서는 관리자 페이지로 리디렉션 (약간의 딜레이)
      if (mode === 'edit') {
        setTimeout(() => {
          router.push('/admin');
        }, 1500);
      }
    } catch (err) {
      console.error('게시글 저장 오류:', err);
      setError(
        err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-300">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-green-700 dark:bg-green-900/20 dark:text-green-300">
          <p>{success}</p>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <Button
          type="button"
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary text-white"
          disabled={saving}
        >
          <FaSave className="size-4" />
          <span>{saving ? '저장 중...' : '저장하기'}</span>
        </Button>

        <Button
          type="button"
          onClick={() => router.push('/admin')}
          className="flex items-center gap-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
        >
          <FaTimes className="size-4" />
          <span>취소</span>
        </Button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="min-h-[70vh] w-full rounded-md border border-gray-300 bg-white p-4 font-mono text-gray-800 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        placeholder="마크다운 형식으로 내용을 작성하세요..."
      />

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2 font-medium">마크다운 형식 팁:</p>
        <ul className="list-disc pl-5">
          <li># 제목, ## 부제목 - 제목 작성</li>
          <li>**굵게**, *기울임* - 텍스트 스타일링</li>
          <li>[링크](url) - 링크 추가</li>
          <li>![대체텍스트](이미지url) - 이미지 추가</li>
          <li>```코드``` - 코드 블록 추가</li>
        </ul>
      </div>
    </div>
  );
};

export default MarkdownEditor;
