import {
  BsLightningCharge,
  FaArrowRight,
  FaCode,
  FaReact,
  FaServer,
  SiNextdotjs
} from '@/components/icons';
import { getPosts } from '@/utils/fetch';
import { cn } from '@/utils/style';
import Image from 'next/image';
import Link from 'next/link';

// 6시간마다 재생성
export const revalidate = 60 * 60 * 6;

// 정적 생성 파라미터
export const generateStaticParams = async () => {
  return [{}]; // 메인 페이지는 파라미터가 없으므로 빈 객체
};

// 동적 렌더링 설정 (상단에 추가)
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 최신 블로그 포스트 가져오기
  const posts = await getPosts({});

  // 임시 이미지 및 설명 추가 (실제로는 마크다운 파일에서 메타데이터를 추출해야 함)
  const featuredPosts = posts.slice(0, 3).map((post, index) => ({
    ...post,
    image: post.image || `/images/placeholder-${(index % 3) + 1}.jpg`,
    description:
      post.description ||
      '이 포스트에 대한 간략한 설명이 이곳에 표시됩니다. 마크다운 파일에 설명을 추가해보세요.'
  }));

  // 기술 카테고리
  const techCategories = [
    {
      name: 'Next.js',
      description: '서버 컴포넌트와 앱 라우터 기반 웹 개발',
      icon: SiNextdotjs,
      color: 'bg-gray-800 text-white'
    },
    {
      name: 'Frontend',
      description: 'React 기반 모던 UI 개발',
      icon: FaReact,
      color: 'bg-sky-500 text-white'
    },
    {
      name: 'Full Stack',
      description: '프론트엔드부터 백엔드까지',
      icon: FaCode,
      color: 'bg-violet-600 text-white'
    },
    {
      name: 'API & Backend',
      description: 'REST API와 서버사이드 개발',
      icon: FaServer,
      color: 'bg-green-600 text-white'
    }
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* 히어로 섹션 */}
      <section className="relative pt-12 lg:pt-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center">
              <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                <SiNextdotjs className="mr-2 size-4" />
                <span>프론트엔드 개발 블로그</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="gradient-text">Next.js</span> 기반
                <br />
                <span className="text-content">풀스택 개발자</span>
              </h1>
              <p className="mb-8 text-lg text-content-dark">
                React, Next.js, TypeScript를 활용한 모던 웹 개발과 풀스택 경험을
                공유합니다. 최신 프론트엔드 기술로 만들어가는 웹의 미래에
                함께하세요.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/posts" className="web3-button">
                  <span>블로그 보기</span>
                  <FaArrowRight className="ml-2 size-4" />
                </Link>
                <Link
                  href="/portfolio"
                  className="rounded-lg border border-white/10 bg-white/5 px-6 py-3 text-content backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  포트폴리오
                </Link>
              </div>
            </div>
            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="relative size-64 rounded-full sm:size-80 lg:size-96">
                <div className="absolute inset-0 animate-spin-slow rounded-full bg-gradient-to-r from-primary via-purple-500 to-accent-2 opacity-70 blur-xl"></div>
                <div className="absolute inset-4 rounded-full bg-bkg backdrop-blur-md"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <SiNextdotjs className="size-32 animate-float text-primary dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 기술 카테고리 섹션 */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">모던 웹 개발</span> 기술 스택
            </h2>
            <p className="mt-4 text-content-dark">
              프론트엔드부터 백엔드까지 풀스택 개발에 사용하는 기술들을
              소개합니다
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {techCategories.map((category) => (
              <div key={category.name} className="web3-card group">
                <div
                  className={cn(
                    'mb-4 inline-flex size-12 items-center justify-center rounded-lg',
                    category.color
                  )}
                >
                  <category.icon className="size-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-content">
                  {category.name}
                </h3>
                <p className="text-content-dark">{category.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 최신 포스트 섹션 */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight">
              <span className="gradient-text">최신 포스트</span>
            </h2>
            <Link
              href="/posts"
              className="inline-flex items-center text-content hover:text-primary"
            >
              <span>모든 포스트 보기</span>
              <FaArrowRight className="ml-2 size-4" />
            </Link>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="web3-glass group flex h-full flex-col transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="relative mb-4 overflow-hidden rounded-lg">
                  <div className="aspect-video bg-bkg-light/30">
                    {post.image ? (
                      <div className="relative h-40 w-full">
                        <Image
                          src={post.image}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-40 items-center justify-center bg-primary/5">
                        <SiNextdotjs className="size-12 text-primary/30" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2 flex items-center">
                    <span className="mr-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      {post.category || 'Next.js'}
                    </span>
                    <span className="text-xs text-content-dark">
                      {new Date(post.date).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-content transition-colors group-hover:text-primary">
                    {post.title}
                  </h3>
                  <p className="line-clamp-2 text-content-dark">
                    {post.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center text-sm text-content-dark">
                  <span className="inline-flex items-center">
                    <BsLightningCharge className="mr-1 size-4 text-primary" />
                    계속 읽기
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 뉴스레터 섹션 */}
      {/* <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl bg-primary/10 p-8 backdrop-blur-xl sm:p-12">
            <div className="absolute -right-24 -top-24 size-64 rounded-full bg-primary/20 blur-3xl"></div>
            <div className="relative grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-content">
                  최신 개발 소식을 놓치지 마세요
                </h2>
                <p className="mt-4 text-content-dark">
                  매주 최신 Next.js, React 개발 소식, 튜토리얼, 팁을 받아보세요.
                  뉴스레터를 구독하고 프론트엔드 기술의 최전선에 함께하세요.
                </p>
              </div>
              <div className="flex items-center">
                <form className="w-full space-y-4">
                  <div className="flex rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50">
                    <input
                      type="email"
                      placeholder="이메일 주소"
                      className="w-full bg-transparent px-3 py-2 text-content focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-primary px-4 py-2 text-white hover:bg-primary-dark"
                    >
                      구독하기
                    </button>
                  </div>
                  <p className="text-xs text-content-dark">
                    구독은 언제든지 취소할 수 있습니다. 개인정보는 안전하게
                    보호됩니다.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section> */}
    </div>
  );
}
