import ContactForm from '@/components/forms/ContactForm';
import {
  AiFillGithub,
  AiOutlineMail,
  FaDiscord,
  FaTwitter
} from '@/components/icons';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '연락처 - Toris Dev Blog',
  description:
    'Toris Dev Blog 운영자에게 연락하는 방법을 안내합니다. 개발 문의, 협업 제안, 피드백 등 다양한 소통 방법을 제공합니다.',
  alternates: {
    canonical: 'https://toris-dev.vercel.app/contact'
  }
};

export const dynamic = 'force-dynamic';

// 서버 컴포넌트 (기본 내보내기)
export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-content dark:text-content-dark">
            연락처
          </h1>
          <p className="mt-4 text-lg text-content/80 dark:text-content-dark/80">
            블로그 관련 문의, 협업 제안, 피드백을 남겨주세요
          </p>
        </div>

        <div className="space-y-10">
          {/* 소개 섹션 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-700">
            <h2 className="mb-4 text-xl font-semibold text-content dark:text-content-dark">
              안녕하세요!
            </h2>
            <div className="space-y-3 text-content/80 dark:text-content-dark/90">
              <p>
                Toris Dev Blog에 관심을 가져주셔서 감사합니다. 블로그 콘텐츠에
                대한 의견이나 질문, 협업 제안, 또는 단순히 인사를 나누고
                싶으시다면 언제든지 연락해 주세요.
              </p>
              <p>
                모든 메시지를 소중히 읽고 가능한 한 빠르게 답변 드리겠습니다.
                특히 기술적인 협업이나 콘텐츠 관련 제안은 항상 환영합니다.
              </p>
            </div>
          </section>

          {/* 연락 폼 */}
          <section className="rounded-lg bg-white p-6 shadow-sm dark:bg-slate-800">
            <h2 className="mb-6 text-xl font-semibold text-content dark:text-content-dark">
              메시지 보내기
            </h2>
            <ContactForm />
          </section>

          {/* 연락 방법 섹션 */}
          <section className="grid gap-6 md:grid-cols-2">
            {/* 이메일 */}
            <div className="rounded-lg bg-primary/5 p-6 shadow-sm transition-transform hover:scale-105 dark:bg-slate-800">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-primary/20">
                  <AiOutlineMail className="size-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-content dark:text-content-dark">
                  이메일
                </h3>
              </div>
              <p className="mb-4 text-content/80 dark:text-content-dark/90">
                가장 확실한 연락 방법입니다. 모든 문의사항을 이메일로
                보내주세요.
              </p>
              <a
                href="mailto:ironjustlikethat@gmail.com"
                className="block rounded-md bg-primary/10 p-3 text-center font-medium text-primary transition-colors hover:bg-primary/20 dark:bg-primary/20 dark:hover:bg-primary/30"
              >
                ironjustlikethat@gmail.com
              </a>
            </div>

            {/* Discord */}
            <div className="rounded-lg bg-[#5865F2]/5 p-6 shadow-sm transition-transform hover:scale-105 dark:bg-[#5865F2]/10">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-[#5865F2]/20">
                  <FaDiscord className="size-5 text-[#5865F2]" />
                </div>
                <h3 className="text-lg font-semibold text-content dark:text-content-dark">
                  Discord
                </h3>
              </div>
              <p className="mb-4 text-content/80 dark:text-content-dark/90">
                실시간 대화가 필요하시면 디스코드 서버에 참여해주세요.
              </p>
              <a
                href="https://discord.gg/uVq7PYEU"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md bg-[#5865F2]/10 p-3 text-center font-medium text-[#5865F2] transition-colors hover:bg-[#5865F2]/20 dark:bg-[#5865F2]/20 dark:hover:bg-[#5865F2]/30"
              >
                Discord 서버 참여하기
              </a>
            </div>

            {/* GitHub */}
            <div className="rounded-lg bg-gray-200/50 p-6 shadow-sm transition-transform hover:scale-105 dark:bg-gray-700/20">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-gray-700/20 dark:bg-gray-600/30">
                  <AiFillGithub className="size-5 text-gray-700 dark:text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-content dark:text-content-dark">
                  GitHub
                </h3>
              </div>
              <p className="mb-4 text-content/80 dark:text-content-dark/90">
                코드나 블로그 관련 이슈는 GitHub에서 확인해주세요.
              </p>
              <a
                href="https://github.com/toris-dev"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md bg-gray-700/10 p-3 text-center font-medium text-gray-700 transition-colors hover:bg-gray-700/20 dark:bg-gray-600/20 dark:text-gray-300 dark:hover:bg-gray-600/30"
              >
                GitHub 프로필 방문하기
              </a>
            </div>

            {/* Twitter */}
            <div className="rounded-lg bg-blue-400/5 p-6 shadow-sm transition-transform hover:scale-105 dark:bg-blue-400/10">
              <div className="mb-4 flex items-center">
                <div className="mr-3 flex size-10 items-center justify-center rounded-full bg-blue-400/20">
                  <FaTwitter className="size-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-content dark:text-content-dark">
                  Twitter
                </h3>
              </div>
              <p className="mb-4 text-content/80 dark:text-content-dark/90">
                최신 소식과 업데이트는 Twitter에서 확인하세요.
              </p>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md bg-blue-400/10 p-3 text-center font-medium text-blue-400 transition-colors hover:bg-blue-400/20 dark:bg-blue-400/20 dark:hover:bg-blue-400/30"
              >
                Twitter 팔로우하기
              </a>
            </div>
          </section>

          {/* 이용 약관 및 저작권 알림 */}
          <section className="rounded-lg border border-yellow-200 bg-yellow-50/20 p-5 dark:border-yellow-900/30 dark:bg-yellow-900/10">
            <h2 className="mb-3 text-lg font-medium text-yellow-800 dark:text-yellow-300">
              이용 약관 참고 사항
            </h2>
            <p className="text-sm text-yellow-700/90 dark:text-yellow-400/90">
              블로그 콘텐츠 이용, 저작권, 포크 및 재사용 조건에 관한 사항은{' '}
              <Link href="/terms" className="font-medium underline">
                이용약관
              </Link>
              을 참조해 주시기 바랍니다. 콘텐츠 재사용 및 포크 요청은 반드시
              사전 허가가 필요합니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
