'use client';

import { useRouter } from 'next/navigation';

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  return (
    <div className="text-black dark:text-white">
      <div className="fixed z-50 flex w-full  justify-between">
        <h4 className="ml-9 mt-5 text-2xl">Toris&apos;s Portpolio</h4>
        <nav className="mr-3 mt-5 flex justify-between gap-8 pr-6">
          <a href="#about" className="hover:text-gray-400">
            About me
          </a>
          <a href="#skills" className="hover:text-gray-400">
            Skills
          </a>
          <a href="#archiving" className="hover:text-gray-400">
            Archiving
          </a>
          <a href="#projects" className="hover:text-gray-400">
            Projects
          </a>
          <a href="#activity" className="hover:text-gray-400">
            Activity
          </a>
        </nav>
      </div>
      <div className="flex h-[1024px] w-full flex-col bg-cover bg-center bg-no-repeat pb-80 ">
        <article className="z-10 flex size-full flex-col items-center justify-center bg-cover pt-16">
          <h2 className="text-4xl font-bold">- 유주환 -</h2>
          <h2 className="m-3 text-4xl font-bold">웹 개발자 포트폴리오</h2>

          <hr className="my-7 w-52 border-t border-t-fuchsia-300" />
          <p className="flex flex-col pb-10 text-center text-xl font-semibold">
            <span className="mb-3">
              안녕하세요. 궁극적으로 SW 엔지니어가 되고 싶은 프론트엔드 개발자
              입니다. <br />
            </span>
            <span>
              기술에 대한 호기심과 가치 있는 일을 하고 싶은 것이 저의
              장점입니다.
            </span>
          </p>
          <button
            onClick={() => router.push('#about')}
            className="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            더 알아보기
          </button>
        </article>
      </div>
      <article>{children}</article>
    </div>
  );
}
