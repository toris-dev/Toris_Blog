'use client';

import Image from 'next/image';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { MarkdownEditor, MarkdownViewer } from '../blog/Markdown';

interface GitHubUser {
  login: string;
  avatar: string;
  url: string;
}

interface LoggedInGitHubUser {
  id: number;
  login: string;
  name: string;
  avatar_url: string;
}

interface GitHubComment {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  user: GitHubUser;
  url: string;
  isAnonymous?: boolean;
}

interface GitHubCommentsProps {
  slug: string;
  title: string;
}

const GitHubComments: React.FC<GitHubCommentsProps> = ({ slug, title }) => {
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [commentMode, setCommentMode] = useState<'anonymous' | 'github'>(
    'anonymous'
  );
  const [gitHubUser, setGitHubUser] = useState<LoggedInGitHubUser | null>(null);
  const [isCheckingLogin, setIsCheckingLogin] = useState(true);
  const nicknameRef = useRef<HTMLInputElement>(null);

  // GitHub 로그인 상태 확인
  useEffect(() => {
    const checkGitHubLogin = async () => {
      try {
        setIsCheckingLogin(true);
        const response = await fetch('/api/auth/github-status');
        const data = await response.json();

        if (data.loggedIn && data.user) {
          setGitHubUser(data.user);
          // GitHub 로그인 되어 있으면 자동으로 GitHub 모드로 설정
          setCommentMode('github');
        }
      } catch (err) {
        console.error('Error checking GitHub login status:', err);
      } finally {
        setIsCheckingLogin(false);
      }
    };

    checkGitHubLogin();

    // URL 파라미터에서 auth_success=true가 있는지 확인하고 있으면 URL 정리
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const authSuccess = urlParams.get('auth_success');

      if (authSuccess === 'true') {
        // 인증 완료 후 URL 정리하고 상태 갱신
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);

        // 딜레이 후에 로그인 상태 다시 확인
        setTimeout(() => {
          checkGitHubLogin();
        }, 500);
      }
    }
  }, []);

  // 로컬 스토리지에서 이전에 사용한 닉네임과 댓글 모드 가져오기
  useEffect(() => {
    const savedNickname = localStorage.getItem('comment-nickname');
    const savedCommentMode = localStorage.getItem('comment-mode');

    if (savedNickname) {
      setNickname(savedNickname);
    }

    if (
      savedCommentMode &&
      (savedCommentMode === 'anonymous' || savedCommentMode === 'github')
    ) {
      // GitHub 로그인이 되어 있지 않을 때만 저장된 모드 적용
      if (!(gitHubUser && savedCommentMode === 'anonymous')) {
        setCommentMode(savedCommentMode);
      }
    }
  }, [gitHubUser]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/github-comments?slug=${slug}`);

        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        setComments(data.comments || []);
      } catch (err) {
        console.error('Error fetching comments:', err);
        setError('Failed to load comments');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchComments();
    }
  }, [slug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!commentContent.trim()) {
      return;
    }

    if (commentMode === 'anonymous' && !nickname.trim()) {
      alert('닉네임을 입력해주세요.');
      nicknameRef.current?.focus();
      return;
    }

    // GitHub 모드인데 로그인되어 있지 않으면 알림
    if (commentMode === 'github' && !gitHubUser) {
      alert('GitHub으로 로그인해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 닉네임과 댓글 모드 로컬 스토리지에 저장
      if (commentMode === 'anonymous') {
        localStorage.setItem('comment-nickname', nickname);
      }
      localStorage.setItem('comment-mode', commentMode);

      // 닉네임을 본문 앞에 추가 (모드에 따라 다르게)
      const displayName =
        commentMode === 'anonymous'
          ? nickname
          : gitHubUser?.name || gitHubUser?.login || 'GitHub 사용자';

      const commentWithNickname = `**${displayName}**님의 댓글:\n\n${commentContent}`;

      const response = await fetch('/api/github-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          body: commentWithNickname,
          slug,
          nickname: displayName,
          commentMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit comment');
      }

      // Show success message
      setShowSuccess(true);
      setCommentContent('');

      // Reload comments
      const commentsResponse = await fetch(`/api/github-comments?slug=${slug}`);
      const commentsData = await commentsResponse.json();

      if (!commentsResponse.ok) {
        console.warn(
          '댓글은 저장되었지만 새로운 댓글 목록을 불러오지 못했습니다.'
        );
      } else {
        setComments(commentsData.comments || []);
      }

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error submitting comment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit comment. GitHub 인증에 문제가 있을 수 있습니다.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // GitHub 로그아웃 함수
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setGitHubUser(null);
      setCommentMode('anonymous');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <div className="mt-6">
      {loading ? (
        <p className="dark:text-gray-300">Loading comments...</p>
      ) : error ? (
        <p className="text-red-500 dark:text-red-400">{error}</p>
      ) : (
        <>
          {comments.length > 0 ? (
            <div className="mb-8 space-y-6">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="rounded-lg border p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-2 flex items-center">
                    <Image
                      src={comment.user.avatar}
                      alt={comment.user.login}
                      className="mr-2 size-8 rounded-full"
                      width={32}
                      height={32}
                    />
                    <div>
                      <span className="font-medium dark:text-white">
                        {/* 닉네임 추출 (첫 번째 Bold 텍스트) */}
                        {comment.body.startsWith('**') &&
                        comment.body.includes('**님의 댓글:')
                          ? comment.body.split('**')[1]
                          : comment.user.login}
                      </span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(comment.createdAt).toLocaleDateString(
                          'ko-KR',
                          {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="prose mt-2 dark:prose-invert">
                    {/* 닉네임 부분을 제외한 본문만 표시 */}
                    <MarkdownViewer
                      value={
                        comment.body.includes('**님의 댓글:')
                          ? comment.body.split('**님의 댓글:\n\n')[1] ||
                            comment.body
                          : comment.body
                      }
                    />
                  </div>
                  <div className="mt-2 text-right">
                    <a
                      href={comment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      GitHub에서 보기
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-6 text-gray-500 dark:text-gray-400">
              아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
            </p>
          )}
        </>
      )}

      <div className="mt-8">
        <h3 className="mb-4 text-xl font-semibold dark:text-white">
          댓글 남기기
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium dark:text-gray-300">
              댓글 작성 방식
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="radio"
                  name="commentMode"
                  checked={commentMode === 'anonymous'}
                  onChange={() => setCommentMode('anonymous')}
                  className="mr-2"
                />
                <span>익명으로 작성</span>
              </label>
              <label className="flex items-center dark:text-gray-300">
                <input
                  type="radio"
                  name="commentMode"
                  checked={commentMode === 'github'}
                  onChange={() => setCommentMode('github')}
                  className="mr-2"
                />
                <span>GitHub으로 작성</span>
              </label>
            </div>
          </div>

          {commentMode === 'anonymous' && (
            <div className="mb-4">
              <label
                htmlFor="nickname"
                className="mb-2 block text-sm font-medium dark:text-gray-300"
              >
                닉네임
              </label>
              <input
                type="text"
                id="nickname"
                ref={nicknameRef}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-md border p-2 dark:border-gray-700 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400"
                placeholder="닉네임을 입력해주세요"
                required
                maxLength={20}
              />
            </div>
          )}

          {commentMode === 'github' && (
            <div className="mb-4 rounded-md border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              {isCheckingLogin ? (
                <p className="text-sm dark:text-gray-300">
                  GitHub 로그인 상태 확인 중...
                </p>
              ) : gitHubUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Image
                      src={gitHubUser.avatar_url}
                      alt={gitHubUser.login}
                      width={40}
                      height={40}
                      className="mr-2 rounded-full"
                    />
                    <div>
                      <p className="font-medium dark:text-white">
                        {gitHubUser.name || gitHubUser.login}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{gitHubUser.login}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    로그아웃
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm dark:text-gray-300">
                    GitHub으로 댓글을 작성하면 GitHub 계정과 연결됩니다. 댓글은
                    GitHub 이슈로 생성됩니다.
                  </p>
                  <a
                    href={`https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${window.location.origin}/api/auth/github-callback?redirect=${encodeURIComponent(window.location.href)}`)}`}
                    className="mt-2 inline-block rounded-md bg-gray-800 px-4 py-2 text-white hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    GitHub으로 로그인
                  </a>
                </>
              )}
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="comment"
              className="mb-2 block text-sm font-medium dark:text-gray-300"
            >
              댓글 내용
            </label>
            <MarkdownEditor
              height="200px"
              value={commentContent}
              onChange={(value) => setCommentContent(value || '')}
            />
          </div>

          {showSuccess && (
            <div className="mb-4 rounded-md bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              댓글이 성공적으로 등록되었습니다.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
              <p className="font-medium">오류 발생:</p>
              <p>{error}</p>
              <p className="mt-2 text-sm">
                잠시 후 다시 시도하거나 관리자에게 문의하세요.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={
              submitting ||
              !commentContent.trim() ||
              (commentMode === 'anonymous' && !nickname.trim()) ||
              (commentMode === 'github' && !gitHubUser)
            }
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400 dark:bg-blue-700 dark:hover:bg-blue-800 dark:disabled:bg-gray-600"
          >
            {submitting ? '등록 중...' : '댓글 등록하기'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GitHubComments;
