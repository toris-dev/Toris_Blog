'use client';

import {
  FaEye,
  FaImage,
  FaMarkdown,
  FaPen,
  FaSave,
  FaTag,
  FaTimes,
  MdCategory,
  MdTitle
} from '@/components/icons';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { ChangeEvent, FormEvent, useCallback, useState } from 'react';

// 마크다운 에디터 컴포넌트를 동적으로 불러옵니다 (클라이언트 사이드 전용)
const MarkdownEditor = dynamic(() => import('@/components/ui/MarkdownEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"></div>
  )
});

// 마크다운 프리뷰 컴포넌트를 동적으로 불러옵니다
const MarkdownPreview = dynamic(
  () => import('@/components/ui/MarkdownPreview'),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 w-full animate-pulse rounded-md bg-gray-100 dark:bg-gray-800"></div>
    )
  }
);

export default function WritePage() {
  // 포스트 데이터 상태
  const [postData, setPostData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    featuredImage: ''
  });
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [issueUrl, setIssueUrl] = useState<string | null>(null);
  const [issueNumber, setIssueNumber] = useState<number | null>(null);

  // 입력 핸들러
  const handleInputChange = useCallback(
    (
      e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      const { name, value } = e.target;
      setPostData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // 마크다운 에디터 콘텐츠 변경 핸들러
  const handleContentChange = useCallback((value: string) => {
    setPostData((prev) => ({ ...prev, content: value }));
  }, []);

  // 포스트 저장 핸들러
  const handleSavePost = async (e: FormEvent) => {
    e.preventDefault();

    if (!postData.title.trim()) {
      setSaveError('제목을 입력해주세요');
      return;
    }

    if (!postData.content.trim()) {
      setSaveError('내용을 입력해주세요');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      setIssueUrl(null);
      setIssueNumber(null);

      // API 호출을 위한 FormData 생성
      const formData = new FormData();
      formData.append('title', postData.title);
      formData.append('content', postData.content);
      formData.append('category', postData.category || 'Uncategorized');
      formData.append('tags', postData.tags);

      if (postData.featuredImage) {
        formData.append('featuredImage', postData.featuredImage);
      }

      // API 호출
      const response = await fetch('/api/markdown', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '포스트 저장에 실패했습니다');
      }

      const data = await response.json();
      console.log('저장 성공:', data);

      // 이슈 URL과 번호 저장 (GitHub 이슈가 생성된 경우)
      if (data.issueUrl) {
        setIssueUrl(data.issueUrl);

        // GitHub 이슈 URL에서 이슈 번호 추출
        const issueMatch = data.issueUrl.match(/\/issues\/(\d+)$/);
        if (issueMatch && issueMatch[1]) {
          const extractedIssueNumber = parseInt(issueMatch[1], 10);
          setIssueNumber(extractedIssueNumber);
        }
      }

      // 성공 시
      setSaveSuccess(true);

      // 저장 성공 후 폼을 초기화할지 여부 (선택적)
      if (data.slug) {
        setTimeout(() => {
          window.location.href = `/posts/${data.slug}${issueNumber ? `?issueNumber=${issueNumber}` : ''}`;
        }, 3000);
      }
    } catch (error) {
      console.error('포스트 저장 오류:', error);
      setSaveError(
        error instanceof Error
          ? error.message
          : '포스트 저장 중 오류가 발생했습니다'
      );
    } finally {
      setIsSaving(false);
    }
  };

  // 이미지 추가 핸들러
  const handleAddImage = () => {
    if (imageUrl.trim()) {
      // 마크다운 이미지 링크 형식으로 추가
      const imageMarkdown = `![이미지](${imageUrl})`;
      setPostData((prev) => ({
        ...prev,
        content: prev.content
          ? `${prev.content}\n${imageMarkdown}`
          : imageMarkdown
      }));
      setImageUrl('');
      setIsImageModalOpen(false);
    }
  };

  // 미리보기/에디터 토글
  const togglePreview = () => setIsPreview(!isPreview);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex items-center justify-between"
      >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          새 글 작성
        </h1>
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePreview}
            className={cn(
              'flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isPreview
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            )}
          >
            {isPreview ? (
              <FaPen className="mr-2" />
            ) : (
              <FaEye className="mr-2" />
            )}
            {isPreview ? '에디터 보기' : '미리보기'}
          </motion.button>
        </div>
      </motion.div>

      <form onSubmit={handleSavePost}>
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          {/* 제목 입력 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-2"
          >
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <MdTitle className="mr-2" /> 제목
            </label>
            <input
              type="text"
              name="title"
              value={postData.title}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              placeholder="제목을 입력하세요"
            />
          </motion.div>

          {/* 카테고리 선택 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <MdCategory className="mr-2" /> 카테고리
            </label>
            <select
              name="category"
              value={postData.category}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
            >
              <option value="">카테고리 선택</option>
              <option value="javascript">JavaScript</option>
              <option value="react">React</option>
              <option value="nextjs">Next.js</option>
              <option value="typescript">TypeScript</option>
              <option value="web">Web</option>
              <option value="tech">Tech</option>
            </select>
          </motion.div>

          {/* 태그 입력 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="mb-2 flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
              <FaTag className="mr-2" /> 태그
            </label>
            <input
              type="text"
              name="tags"
              value={postData.tags}
              onChange={handleInputChange}
              className="w-full rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
              placeholder="쉼표로 구분하여 입력 (예: javascript, react, web)"
            />
          </motion.div>
        </div>

        {/* 에디터 툴바 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-3 flex items-center rounded-t-lg border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-800"
        >
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsImageModalOpen(true)}
              className="rounded p-2 text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700"
              title="이미지 추가"
            >
              <FaImage size={16} />
            </button>
            <div className="flex h-6 items-center border-l border-gray-300 dark:border-gray-600"></div>
            <div className="flex items-center rounded bg-gray-200 px-2 py-1 dark:bg-gray-700">
              <FaMarkdown
                className="mr-2 text-purple-600 dark:text-purple-400"
                size={16}
              />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Markdown
              </span>
            </div>
          </div>
        </motion.div>

        {/* 에디터/미리보기 영역 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-6 min-h-[500px] rounded-b-lg border border-gray-200 dark:border-gray-700"
        >
          <AnimatePresence mode="wait">
            {isPreview ? (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="size-full"
              >
                <MarkdownPreview
                  content={postData.content}
                  className="min-h-[500px] p-6"
                />
              </motion.div>
            ) : (
              <motion.div
                key="editor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="size-full"
              >
                <MarkdownEditor
                  value={postData.content}
                  onChange={handleContentChange}
                  placeholder="마크다운 형식으로 내용을 작성하세요..."
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 저장 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-between"
        >
          <div>
            {saveError && (
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-500"
              >
                {saveError}
              </motion.p>
            )}
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-300"
              >
                <p>✅ 포스트가 성공적으로 저장되었습니다!</p>
                {issueUrl && (
                  <div className="mt-2">
                    <p>
                      GitHub 이슈가 생성되었습니다
                      {issueNumber && ` (이슈 번호: #${issueNumber})`}
                    </p>
                    <a
                      href={issueUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block font-medium text-green-700 underline hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                    >
                      GitHub 이슈 보기 →
                    </a>
                  </div>
                )}
                <p className="mt-2">잠시 후 포스트 페이지로 이동합니다...</p>
              </motion.div>
            )}
          </div>
          <div className="flex space-x-3">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <FaTimes className="mr-2" /> 취소
            </motion.button>
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex items-center rounded-md bg-blue-600 px-4 py-2 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600',
                isSaving && 'cursor-not-allowed opacity-70'
              )}
            >
              <FaSave className="mr-2" />
              {isSaving ? '저장 중...' : '저장하기'}
            </motion.button>
          </div>
        </motion.div>
      </form>

      {/* 이미지 URL 모달 */}
      <AnimatePresence>
        {isImageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setIsImageModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
            >
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                이미지 추가
              </h3>
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  이미지 URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-500 dark:focus:ring-blue-500/20"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsImageModalOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  추가
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
