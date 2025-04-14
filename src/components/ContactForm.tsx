'use client';

import Button from '@/components/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { AiOutlineMail, AiOutlineSend } from 'react-icons/ai';
import { FaDiscord, FaEthereum, FaGithub, FaTwitter } from 'react-icons/fa';

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
    <div className="container max-w-5xl py-16">
      <h1 className="mb-16 text-center text-4xl font-bold">
        <span className="gradient-text">Contact</span> Us
      </h1>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* Left side - Contact form */}
        <div className="web3-card">
          <h2 className="mb-6 text-2xl font-bold">메시지 보내기</h2>

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
                    <FaGithub className="size-4" />
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
                  className="mb-1 block text-sm font-medium"
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-content backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium"
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-content backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-1 block text-sm font-medium"
                >
                  문의 유형
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-content backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="">선택하세요</option>
                  <option value="프로젝트 문의">프로젝트 문의</option>
                  <option value="협업 제안">협업 제안</option>
                  <option value="블로그 관련">블로그 관련</option>
                  <option value="기타">기타</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-sm font-medium"
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
                  className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-content backdrop-blur-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>

              <Button type="submit" className="w-full" disabled={sending}>
                {sending ? '전송 중...' : '메시지 보내기'}
              </Button>
            </form>
          )}
        </div>

        {/* Right side - Contact information */}
        <div className="space-y-6">
          <div className="web3-card bg-gradient-to-r from-primary/10 via-transparent to-accent-2/10">
            <h2 className="mb-6 text-2xl font-bold">연락처</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <AiOutlineMail className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">이메일</h3>
                  <Link
                    href="mailto:contact@toris-dev.com"
                    className="text-content-dark hover:text-primary"
                  >
                    ironjustlikethat@gmail.com
                  </Link>
                </div>
              </div>

              <div className="flex items-start">
                <div className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <FaDiscord className="size-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Discord</h3>
                  <Link
                    className="text-content-dark hover:text-primary"
                    href="https://discord.gg/uVq7PYEU"
                  >
                    toris_dev
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="web3-card">
            <h2 className="mb-6 text-2xl font-bold">소셜 미디어</h2>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/toris-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary transition-all hover:bg-primary/20"
              >
                <FaGithub size={20} />
                <span>GitHub</span>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full bg-primary/10 px-5 py-2 text-primary transition-all hover:bg-primary/20"
              >
                <FaTwitter size={20} />
                <span>Twitter</span>
              </a>
            </div>
          </div>

          <div className="web3-card">
            <h2 className="mb-6 text-2xl font-bold">
              <span className="gradient-text">기술</span> 프로젝트 문의
            </h2>
            <div className="flex items-start">
              <div className="mr-3 flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <FaEthereum className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-content">
                  Next.js, Supabase, AI 도구 등을 활용한 웹 애플리케이션 개발 및
                  프로젝트 협업 문의는 언제든지 환영합니다. 함께 혁신적인
                  서비스를 개발해보세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
