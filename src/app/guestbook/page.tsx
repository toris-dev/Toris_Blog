'use client';

import { FaGithub, FaPaperPlane, IoRefresh } from '@/components/icons';
import { cn } from '@/utils/style';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

// 방문록 타입 정의
interface GuestbookComment {
  id: number;
  user: {
    login: string;
    avatar_url: string;
    html_url: string;
  };
  body: string;
  created_at: string;
}

// GitHub 사용자 타입 정의
interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
}

export default function GuestbookPage() {
  const [comments, setComments] = useState<GuestbookComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [userId, setUserId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // 방문록 댓글 불러오기
  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/guestbook');
      if (!res.ok) throw new Error('방문록을 불러오는데 실패했습니다.');

      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error('방문록 불러오기 오류:', err);
      setError(
        '방문록을 불러오는데 문제가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 방문록 작성
  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim() || !userId.trim()) {
      setError('닉네임과 방문록 내용을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: commentText,
          user_id: userId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || '방문록 작성에 실패했습니다.');
      }

      setCommentText('');
      setSuccess('방문록이 성공적으로 작성되었습니다!');

      // 성공 메시지 3초 후 사라짐
      setTimeout(() => setSuccess(null), 3000);

      // 댓글 다시 불러오기
      fetchComments();
    } catch (err: any) {
      console.error('방문록 작성 오류:', err);
      setError(
        err.message ||
          '방문록 작성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    // 초기 데이터 로딩
    fetchComments();
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          방문록
        </h1>
        <p className="mb-8 text-gray-600 dark:text-gray-300">
          방문해 주셔서 감사합니다! 방문 소감이나 하고 싶은 말을 남겨주세요.
        </p>
      </motion.div>

      {/* 방문록 작성 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10 rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
      >
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          방문록 작성
        </h2>

        <form onSubmit={submitComment}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              닉네임
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="닉네임을 입력하세요"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 
                      text-gray-800 transition duration-200 focus:outline-none
                      focus:ring-2 focus:ring-blue-500 dark:border-gray-600 
                      dark:bg-gray-700 dark:text-gray-200"
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              내용
            </label>
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="방문록 내용을 입력해주세요..."
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 
                      text-gray-800 transition duration-200 focus:outline-none
                      focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
              rows={4}
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || !commentText.trim() || !userId.trim()}
              className={cn(
                'flex items-center rounded-lg px-5 py-2 font-medium transition duration-200',
                'bg-blue-600 text-white hover:bg-blue-700',
                'dark:bg-blue-700 dark:hover:bg-blue-600',
                'disabled:cursor-not-allowed disabled:opacity-50'
              )}
            >
              {submitting ? (
                <>
                  <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  전송 중...
                </>
              ) : (
                <>
                  <FaPaperPlane className="mr-2" /> 작성하기
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-md bg-red-50 p-3 text-red-800 dark:bg-red-900/20 dark:text-red-200"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-md bg-green-50 p-3 text-green-800 dark:bg-green-900/20 dark:text-green-200"
            >
              {success}
            </motion.div>
          )}
        </form>
      </motion.div>

      {/* 방문록 리스트 */}
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            방문객 댓글 ({comments.length})
          </h2>

          <button
            onClick={fetchComments}
            disabled={loading}
            className={cn(
              'flex items-center rounded-lg px-3 py-1 text-sm transition duration-200',
              'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
              'hover:bg-gray-300 dark:hover:bg-gray-600',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <IoRefresh className={cn('mr-1', loading && 'animate-spin')} />{' '}
            새로고침
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="size-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg bg-gray-100 p-12 text-center dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-300">
              아직 방문록이 없습니다. 첫 번째 방문록을 작성해보세요!
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <ul className="space-y-4">
              {comments.map((comment, index) => {
                // 댓글 내용에서 닉네임과 본문 분리
                let displayName = comment.user.login;
                let bodyContent = comment.body;
                let isCustomUser = false;

                // 사용자 ID로 작성한 방문록 형식 파싱
                const customUserMatch = comment.body.match(
                  /\*\*(.*?)님의 방문록\*\*\n\n([\s\S]*)/
                );
                if (customUserMatch && customUserMatch.length >= 3) {
                  displayName = customUserMatch[1];
                  bodyContent = customUserMatch[2];
                  isCustomUser = true;
                }

                return (
                  <motion.li
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="rounded-lg bg-white p-6 shadow-md dark:bg-gray-800"
                  >
                    <div className="flex items-start">
                      <div className="mr-4 shrink-0">
                        {isCustomUser ? (
                          <div className="flex size-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            {displayName.slice(0, 2).toUpperCase()}
                          </div>
                        ) : (
                          <a
                            href={comment.user.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Image
                              src={comment.user.avatar_url}
                              alt={comment.user.login}
                              width={50}
                              height={50}
                              className="rounded-full"
                            />
                          </a>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center font-medium text-gray-900 dark:text-white">
                            {displayName}
                            {!isCustomUser && (
                              <a
                                href={comment.user.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-1 text-gray-500 dark:text-gray-400"
                              >
                                <FaGithub className="ml-1" />
                              </a>
                            )}
                          </div>

                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>

                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                            {bodyContent}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
