'use client';

import Link from 'next/link';
import { BsGithub } from 'react-icons/bs';
import { SiTistory } from 'react-icons/si';

const Archiving = () => {
  return (
    <article
      id="archiving"
      className="flex w-full flex-1 flex-col bg-slate-900"
    >
      <h2 className="py-5 text-center text-2xl text-white">Archiving</h2>
      <div className="flex justify-center">
        <Link
          href={'https://github.com/toris-dev'}
          target="blank"
          className="underline-on-hover m-8 flex w-1/4 flex-col justify-center rounded-3xl border bg-white p-10 shadow-2xl"
        >
          <div className="flex items-center">
            <BsGithub size={80} />
            <h4 className="pl-8 text-4xl">Github</h4>
          </div>
          <span className="link py-8 text-blue-400">github.com/toris-dev</span>
          <p>소스 코드 저장소 입니다.</p>
          <li>협업했던 프로젝트 소스 코드</li>
          <li>혼자 프로젝트 진행했던 FE, BE 소스 코드</li>
          <li>학습을 위해 사용했던 소스 코드</li>
        </Link>
        <Link
          href={'https://github.com/toris-dev'}
          target="blank"
          className="underline-on-hover m-8 flex w-1/4 flex-col justify-center rounded-3xl border bg-white p-10 shadow-2xl"
        >
          <div className="flex items-center">
            <SiTistory size={80} className="text-orange-600" />
            <h4 className="pl-8 text-4xl">Tistory</h4>
          </div>
          <span className="link py-8 text-blue-400">github.com/toris-dev</span>
          <p>학습, 및 지식 공유 목적의 블로그 입니다.</p>
          <li>학습한 내용을 본인 것으로 만들기 위한 기록</li>
          <li>개발자의 길을 걸으며 알게 된 내용을 기록</li>
          <li>얼핏 알고 있는 내용을 복습하기 위한 기록</li>
        </Link>
      </div>
    </article>
  );
};

export default Archiving;
