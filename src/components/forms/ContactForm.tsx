'use client';

import { AiOutlineSend } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [commentUrl, setCommentUrl] = useState('');

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      // 실제 API 호출로 GitHub 이슈에 댓글 추가
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '메시지 전송에 실패했습니다');
      }

      // 성공 시 댓글 URL 저장
      if (data.commentUrl) {
        setCommentUrl(data.commentUrl);
      }

      setSent(true);
    } catch (err: any) {
      setError(err.message || '메시지 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {sent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-green-50 p-6 dark:bg-green-900/20"
        >
          <div className="flex items-center justify-center">
            <div className="mr-3 flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
              <AiOutlineSend className="size-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-800 dark:text-green-300">
                메시지가 전송되었습니다!
              </h3>
              <p className="text-green-600 dark:text-green-400">
                빠른 시일 내에 답변 드리겠습니다.
              </p>
            </div>
          </div>

          {commentUrl && (
            <div className="mt-4 text-center">
              <a
                href={commentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                GitHub에서 문의 내용 보기
              </a>
            </div>
          )}

          <Button
            className="mt-4 w-full bg-green-600 hover:bg-green-700"
            onClick={() => {
              setSent(false);
              setCommentUrl('');
              setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
              });
            }}
          >
            새 메시지 작성
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-foreground dark:text-muted-foreground"
            >
              이름
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-background dark:text-muted-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-foreground dark:text-muted-foreground"
            >
              이메일
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-background dark:text-muted-foreground"
            />
          </div>

          <div>
            <label
              htmlFor="subject"
              className="mb-1 block text-sm font-medium text-foreground dark:text-muted-foreground"
            >
              문의 유형
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-background dark:text-muted-foreground"
            >
              <option value="">선택하세요</option>
              <option value="프론트엔드 개발">프론트엔드 개발</option>
              <option value="풀스택 프로젝트">풀스택 프로젝트</option>
              <option value="Next.js 컨설팅">Next.js 컨설팅</option>
              <option value="블로그 관련">블로그 관련</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="message"
              className="mb-1 block text-sm font-medium text-foreground dark:text-muted-foreground"
            >
              메시지
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-700 dark:bg-background dark:text-muted-foreground"
            />
          </div>

          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? '전송 중...' : '메시지 보내기'}
          </Button>
        </form>
      )}
    </div>
  );
}
