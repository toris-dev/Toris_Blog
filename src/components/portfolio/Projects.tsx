'use client';

import '@/styles/carousel.module.css';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Carousel from 'react-material-ui-carousel';

import Skill from './project/Skill';
const shelterImages = [
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2F124a14e0-54be-440b-82f3-d1cd4e913b0f%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0004.jpg&blockId=1dcb93dc-5ef5-4859-b833-81c68883634b',
    alt: '주요 설명',
    label: '쉼터 주요 설명'
  },
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2Fe2002379-4547-4eb2-82f9-b5b63e192668%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0005.jpg&blockId=17b7d305-aa75-44fa-afeb-1240e93d2b08',
    alt: '프론트엔드 개발',
    label: '프론트엔드 개발'
  },
  {
    url: 'https://oopy.lazyrockets.com/api/v2/notion/image?src=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F38552da6-340d-42c1-a9a1-b181ff331f03%2F805f8749-deb7-42d4-acca-5af36f3ac814%2F%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258F%25E1%2585%25A1%25E1%2584%258B%25E1%2585%25A9SW02_page-0006.jpg&blockId=8a5ea47a-4c36-4d6c-b3ae-57af4e4f7067',
    alt: '백엔드 개발',
    label: '백엔드 개발'
  }
];

const selfBlogImages = [
  {
    url: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FcwlQW3%2FbtsGbVxG5Ct%2Fl1aqJWmtoZLAQejwRsaP11%2Fimg.png',
    alt: 'ligthHouse 표',
    label: 'ligthHouse 표'
  },
  {
    url: 'https://img1.daumcdn.net/thumb/R1280x0/?scode=mtistory2&fname=https%3A%2F%2Fblog.kakaocdn.net%2Fdn%2FTEOI5%2FbtsGReRt513%2FpUJRlodPnvdctt4i1r0bak%2Fimg.png',
    alt: '챗봇',
    label: '챗봇'
  },
  {
    url: '/comment.png',
    alt: '댓글 이미지',
    label: '블로그 댓글'
  }
];

const Projects = () => {
  const router = useRouter();
  const responsive = {
    superLargeDesktop: {
      breakpoint: { max: 4000, min: 3000 },
      items: 5
    },
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 3
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 2
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1
    }
  };
  return (
    <article id="projects" className="flex w-full flex-col items-center pb-8">
      <h2 className="mb-5 mt-7 text-center text-2xl font-bold">
        프로젝트 소개
      </h2>

      <div className="h-[600px] w-4/5 justify-center rounded-3xl bg-white shadow-2xl">
        <div className="mt-8 flex h-full flex-col">
          <h4 className="items-start text-center text-2xl font-bold">쉼터</h4>
          <span className="mb-9 text-center text-slate-500">
            2023.09 ~ 2023.10 (구름 하반기 프로젝트)
          </span>
          <div className="flex flex-row justify-between">
            <Carousel height={300} className="w-[500px]" animation="slide">
              {shelterImages.map((image) => (
                <div key={image.alt}>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={600}
                    height={300}
                  />
                </div>
              ))}
            </Carousel>
            <div className="mt-0 flex w-4/5 flex-col gap-1 pl-8 ">
              <ul>
                <li>
                  <b>국군 장병들을 위한 원격 정신 케어 서비스</b>
                </li>
                <li>
                  <span>
                    전문 상담관과의 원격 상담, 국방 신문고, 국군 장병 커뮤니티,
                    군 생활 도우미
                  </span>
                </li>
                <li>
                  <span>크로스플랫폼 앱 개발을 위해 React Native 선택</span>
                </li>
                <li>의사소통을 비용을 줄이기 위해 Express + Graphql 개발.</li>
                <li>단일 엔드포인트 API 개발</li>
                <li>
                  <b>역할: </b>백엔드 파트로 진행하였지만 프론트엔드분들의
                  부재로 인해 React의 경험을 살려 React Native를 이용하여 개발
                  진행
                </li>
              </ul>
              <hr />

              <a
                className="my-3  flex h-10 w-48 items-center justify-center rounded-xl bg-gray-900 text-white"
                href="https://github.com/toris-dev/kakao_sw02_backend"
                target="blank"
              >
                자세히 보기 ▶ README
              </a>

              <Skill
                url="https://github.com/toris-dev/kakao_sw02_backend"
                title="Backend Github Repo:&nbsp;"
                type="link"
              />
              <Skill
                url="https://github.com/toris-dev/kakao_sw02_frontend"
                title="Frontend Github Repo:&nbsp;"
                type="link"
              />
              <Skill
                title="Backend Tech:&nbsp;"
                tech="Express, Mongoose, Apollo-Graphql"
              />
              <Skill
                title="Frontend Tech:&nbsp;"
                tech="React Native, Expo SDK"
              />
              <Skill title="DataBase:&nbsp;" tech="Mongodb" />
              <Skill
                title="Development:&nbsp;"
                tech="Heroku, Git, Gitpod, prettier, eslint"
              />
            </div>
          </div>
        </div>
      </div>
      <hr className="my-7 w-3/5 border-t border-dashed border-gray-800" />

      {/* 개인블로그 */}
      <div className="h-[600px] w-4/5 justify-center rounded-3xl bg-white shadow-2xl">
        <div className="mt-8 flex h-full flex-col">
          <h4 className="items-start text-center text-2xl font-bold">
            개인 블로그 제작
          </h4>
          <span className="mb-9 text-center text-slate-500">
            2024.03 ~ 2024.04 (1人 개인 프로젝트)
          </span>
          <div className="flex flex-row justify-between">
            <Carousel height={300} className="w-[500px]" animation="slide">
              {selfBlogImages.map((image) => (
                <div key={image.alt}>
                  <Image
                    src={image.url}
                    alt={image.alt}
                    width={600}
                    height={300}
                  />
                </div>
              ))}
            </Carousel>
            <div className="mt-0 flex w-4/5 flex-col gap-1 pl-8 ">
              <ul>
                <li>
                  <b>Next.JS로 SEO, 성능 최적화 개인 블로그 제작</b>
                </li>
                <li>
                  <p>
                    Next.JS Pages Router 에서 App Router로 마이그레이션 작업을
                    통해 최적화 진행.
                  </p>
                </li>
                <li>
                  <p>
                    light house 지표를 [100, 100, 74, 100] 통해 성능개선 확인
                  </p>
                </li>
                <li>
                  <b>
                    게시글, 댓글, 대댓글, 좋아요, 태그, 카테고리, 관리자 계정
                    구현
                  </b>
                </li>

                <li>
                  <p>번들 사이즈 36% 감소</p>
                </li>
                <li>
                  <p>
                    Github Actions + Vercel 을 통해 CI/CD 구축하여 vercel 에
                    배포
                  </p>
                </li>
              </ul>
              <hr />

              <a
                className="my-3  flex h-10 w-48 items-center justify-center rounded-xl bg-gray-900 text-white"
                href="https://github.com/toris-dev/Toris_Blog"
                target="blank"
              >
                자세히 보기 ▶ README
              </a>
              <Skill
                url="https://github.com/toris-dev/Toris_Blog"
                title="Github Repo:&nbsp;"
                type="link"
              />
              <Skill title="language Tech:&nbsp;" tech="Typescript" />

              <Skill
                title="Backend Tech:&nbsp;"
                tech="Node.JS, openai API, Supabase"
              />
              <Skill
                title="Frontend Tech:&nbsp;"
                tech="Next.JS, @tanstack/react-query, tailwindcss, react-intersection-observer"
              />
              <Skill title="DataBase:&nbsp;" tech="Supabase" />
              <Skill title="Test:&nbsp;" tech="cypress" />
              <Skill title="Development:&nbsp;" tech="ESlint, Prettier, Git" />
              <Skill title="Deployment:&nbsp;" tech="Vercel, Github Actions" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default Projects;
