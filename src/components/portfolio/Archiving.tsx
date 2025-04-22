'use client';

import { FaBloggerB } from '@react-icons/all-files/fa/FaBloggerB';
import { FaGithub } from '@react-icons/all-files/fa/FaGithub';
import { motion } from 'framer-motion';
import Link from 'next/link';

const Archiving = () => {
  return (
    <article id="archiving" className="flex w-full flex-1 flex-col py-16">
      <h2 className="py-5 text-center text-2xl font-semibold text-black dark:text-white">
        Archiving
      </h2>
      <div className="flex flex-col justify-center lg:flex-row">
        <motion.div
          className="w-full px-4 lg:w-1/2"
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Link
            href={'https://github.com/toris-dev'}
            target="blank"
            className="underline-on-hover m-2 flex flex-col justify-center rounded-3xl border bg-white p-4 shadow-2xl transition-all duration-300 hover:shadow-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:shadow-blue-900 lg:m-8 lg:p-10"
          >
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FaGithub size={60} className="lg:text-6xl" />
              </motion.div>
              <h4 className="pl-4 text-2xl lg:pl-8 lg:text-4xl">Github</h4>
            </div>
            <span className="link py-4 text-blue-400 hover:underline lg:py-8">
              github.com/toris-dev
            </span>
            <p className="font-medium">소스 코드 저장소 입니다.</p>
            <ul className="mt-2 list-disc pl-5">
              <li>협업했던 프로젝트 소스 코드</li>
              <li>혼자 프로젝트 진행했던 FE, BE 소스 코드</li>
              <li>학습을 위해 사용했던 소스 코드</li>
            </ul>
          </Link>
        </motion.div>

        <motion.div
          className="w-full px-4 lg:w-1/2"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
        >
          <Link
            href={'https://github.com/toris-dev'}
            target="blank"
            className="underline-on-hover m-2 flex flex-col justify-center rounded-3xl border bg-white p-4 shadow-2xl transition-all duration-300 hover:shadow-orange-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:shadow-orange-900 lg:m-8 lg:p-10"
          >
            <div className="flex items-center">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <FaBloggerB size={60} className="text-orange-600 lg:text-6xl" />
              </motion.div>
              <h4 className="pl-4 text-2xl lg:pl-8 lg:text-4xl">Tistory</h4>
            </div>
            <span className="link py-4 text-blue-400 hover:underline lg:py-8">
              github.com/toris-dev
            </span>
            <p className="font-medium">
              학습, 및 지식 공유 목적의 블로그 입니다.
            </p>
            <ul className="mt-2 list-disc pl-5">
              <li>학습한 내용을 본인 것으로 만들기 위한 기록</li>
              <li>개발자의 길을 걸으며 알게 된 내용을 기록</li>
              <li>얼핏 알고 있는 내용을 복습하기 위한 기록</li>
            </ul>
          </Link>
        </motion.div>
      </div>
    </article>
  );
};

export default Archiving;
