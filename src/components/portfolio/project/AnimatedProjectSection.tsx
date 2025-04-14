'use client';

import { AiFillGithub } from '@react-icons/all-files/ai/AiFillGithub';
import { FaBlog } from '@react-icons/all-files/fa/FaBlog';
import { FaCodeBranch } from '@react-icons/all-files/fa/FaCodeBranch';
import { FaDatabase } from '@react-icons/all-files/fa/FaDatabase';
import { FaGithub } from '@react-icons/all-files/fa/FaGithub';
import { FaLaptopCode } from '@react-icons/all-files/fa/FaLaptopCode';
import { FaNodeJs } from '@react-icons/all-files/fa/FaNodeJs';
import { FaReact } from '@react-icons/all-files/fa/FaReact';
import { FaTools } from '@react-icons/all-files/fa/FaTools';
import { HiLightBulb } from '@react-icons/all-files/hi/HiLightBulb';
import { motion } from 'framer-motion';
import React from 'react';
import ProjectCarousel from './ProjectCarousel';

// 아이콘 타입 정의
interface IconProps {
  className?: string;
}

type IconType = React.ComponentType<IconProps>;

// 아이콘 이름에서 컴포넌트 매핑을 위한 객체
const iconMap: Record<string, IconType> = {
  FaBlog,
  FaLaptopCode,
  FaReact,
  FaNodeJs,
  FaDatabase,
  FaCodeBranch,
  FaTools,
  AiFillGithub,
  HiLightBulb,
  FaGithub
};

// 대체 아이콘 정의 - 없는 아이콘을 기존 아이콘으로 대체
const mdPhoneIphone = FaLaptopCode;
const mdHealthAndSafety = FaTools;
const mdWeb = FaReact;
const siExpress = FaNodeJs;
const siMongodb = FaDatabase;
const siGraphql = FaCodeBranch;
const siTypescript = FaCodeBranch;
const siNextdotjs = FaReact;
const siTailwindcss = FaLaptopCode;
const siCypress = FaTools;
const siVercel = FaGithub;
const tbApi = FaNodeJs;

// iconMap에 대체 아이콘 추가
Object.assign(iconMap, {
  MdPhoneIphone: mdPhoneIphone,
  MdHealthAndSafety: mdHealthAndSafety,
  MdWeb: mdWeb,
  SiExpress: siExpress,
  SiMongodb: siMongodb,
  SiGraphql: siGraphql,
  SiTypescript: siTypescript,
  SiNextdotjs: siNextdotjs,
  SiTailwindcss: siTailwindcss,
  SiCypress: siCypress,
  SiVercel: siVercel,
  TbApi: tbApi
});

interface TechItem {
  icon: string; // 아이콘 이름 (문자열)
  label: string;
  color: string;
}

interface RepoLink {
  label: string;
  url: string;
}

interface ProjectProps {
  id: string;
  period: string;
  title: string;
  subtitle: string;
  description: string;
  icon1: string; // 아이콘 이름 (문자열)
  icon2: string; // 아이콘 이름 (문자열)
  highlights: string[];
  role?: string;
  repoLinks: RepoLink[];
  tech: {
    language?: TechItem[];
    backend: TechItem[];
    frontend: TechItem[];
    database: TechItem[];
    test?: TechItem[];
    devTools: TechItem[];
  };
  images: {
    url: string;
    alt: string;
    label: string;
  }[];
}

interface AnimatedProjectSectionProps {
  project: ProjectProps;
  isLast: boolean;
}

const AnimatedProjectSection = ({
  project,
  isLast
}: AnimatedProjectSectionProps) => {
  const projectVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 }
    }
  };

  // 아이콘 이름으로부터 실제 아이콘 컴포넌트를 가져오는 함수
  const getIconComponent = (iconName: string): IconType => {
    const IconComponent = iconMap[iconName];
    if (!IconComponent) {
      console.warn(`Icon ${iconName} not found in icon map`);
      return FaTools; // 기본 폴백 아이콘
    }
    return IconComponent;
  };

  return (
    <>
      <motion.div
        className="mb-20 w-full justify-center rounded-xl bg-white p-8 shadow-xl dark:border dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        variants={projectVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="flex h-full flex-col">
          <div className="mb-8 flex flex-col items-center text-center">
            <span
              className={`mb-2 rounded-full px-4 py-1 text-xs font-medium ${
                project.id === 'shelter'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                  : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
              }`}
            >
              {project.period}
            </span>
            <div className="flex items-center space-x-3">
              {React.createElement(getIconComponent(project.icon1), {
                className: `text-3xl ${project.id === 'shelter' ? 'text-blue-500' : 'text-purple-500'}`
              })}
              <h3
                className={`bg-gradient-to-r ${
                  project.id === 'shelter'
                    ? 'from-blue-600 to-violet-600'
                    : 'from-purple-600 to-pink-600'
                } bg-clip-text text-3xl font-extrabold text-transparent`}
              >
                {project.title}
              </h3>
              {React.createElement(getIconComponent(project.icon2), {
                className: `text-2xl ${project.id === 'shelter' ? 'text-green-500' : 'text-pink-500'}`
              })}
            </div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {project.subtitle}
            </p>
          </div>

          <div className="flex flex-col justify-between gap-8 lg:flex-row">
            <div className="mx-auto w-full lg:mx-0 lg:w-[500px]">
              <ProjectCarousel images={project.images} />
            </div>

            <div className="flex w-full flex-col gap-6 px-4 lg:w-[55%] lg:pl-8">
              <div
                className={`rounded-lg p-4 ${
                  project.id === 'shelter'
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-purple-50 dark:bg-purple-900/20'
                }`}
              >
                <div className="mb-2 flex items-center">
                  <HiLightBulb className="mr-2 text-2xl text-amber-500" />
                  <h4
                    className={`text-xl font-bold ${
                      project.id === 'shelter'
                        ? 'text-blue-800 dark:text-blue-300'
                        : 'text-purple-800 dark:text-purple-300'
                    }`}
                  >
                    프로젝트 개요
                  </h4>
                </div>
                <p className="mb-4 text-gray-700 dark:text-gray-300">
                  {project.description}
                </p>
                <ul className="space-y-2 pl-5 text-gray-700 dark:text-gray-300">
                  {project.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <span
                        className={`mr-2 mt-1 ${
                          project.id === 'shelter'
                            ? 'text-blue-500'
                            : 'text-purple-500'
                        }`}
                      >
                        •
                      </span>
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {project.role && (
                <div
                  className={`rounded-lg p-4 ${
                    project.id === 'shelter'
                      ? 'bg-purple-50 dark:bg-purple-900/20'
                      : 'bg-blue-50 dark:bg-blue-900/20'
                  }`}
                >
                  <div className="mb-2 flex items-center">
                    <FaLaptopCode className="mr-2 text-xl text-purple-600" />
                    <h4
                      className={`text-xl font-bold ${
                        project.id === 'shelter'
                          ? 'text-purple-800 dark:text-purple-300'
                          : 'text-blue-800 dark:text-blue-300'
                      }`}
                    >
                      나의 역할
                    </h4>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {project.role}
                  </p>
                </div>
              )}

              {project.repoLinks.length > 0 && (
                <div className={`mt-2 grid grid-cols-1 gap-8 md:grid-cols-2`}>
                  {project.repoLinks.map((link, index) => (
                    <motion.a
                      key={index}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-white transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <FaGithub className="text-xl" />
                      <span>{link.label}</span>
                    </motion.a>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {/* 기술 스택 표시 */}
                {project.tech.language && (
                  <TechSection
                    title="Language"
                    items={project.tech.language}
                    bgColor="bg-pink-100 dark:bg-pink-900/30"
                    getIconComponent={getIconComponent}
                  />
                )}
                <TechSection
                  title="Backend Tech"
                  items={project.tech.backend}
                  bgColor="bg-green-100 dark:bg-green-900/30"
                  getIconComponent={getIconComponent}
                />
                <TechSection
                  title="Frontend Tech"
                  items={project.tech.frontend}
                  bgColor="bg-blue-100 dark:bg-blue-900/30"
                  getIconComponent={getIconComponent}
                />
                <TechSection
                  title="Database"
                  items={project.tech.database}
                  bgColor="bg-yellow-100 dark:bg-yellow-900/30"
                  getIconComponent={getIconComponent}
                />
                {project.tech.test && (
                  <TechSection
                    title="Test"
                    items={project.tech.test}
                    bgColor="bg-purple-100 dark:bg-purple-900/30"
                    getIconComponent={getIconComponent}
                  />
                )}
                <TechSection
                  title={
                    project.id === 'shelter'
                      ? 'Development'
                      : 'Development & Deployment'
                  }
                  items={project.tech.devTools}
                  bgColor={
                    project.id === 'shelter'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-indigo-100 dark:bg-indigo-900/30'
                  }
                  getIconComponent={getIconComponent}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {!isLast && (
        <motion.div
          className="relative mb-16 w-full"
          initial={{ width: 0 }}
          whileInView={{ width: '100%' }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex w-full justify-center">
            <div className="h-0.5 w-1/3 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-600"></div>
          </div>
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-md dark:bg-gray-800"
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            <div className="size-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

// 기술 스택 섹션 컴포넌트
interface TechSectionProps {
  title: string;
  items: TechItem[];
  bgColor: string;
  getIconComponent: (iconName: string) => IconType;
}

const TechSection = ({
  title,
  items,
  bgColor,
  getIconComponent
}: TechSectionProps) => {
  return (
    <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700/30">
      <div className="mb-2 flex items-center">
        <div
          className={`mr-3 flex size-8 items-center justify-center rounded-full ${bgColor}`}
        >
          {React.createElement(getIconComponent(items[0].icon), {
            className: `text-lg ${items[0].color.split(' ')[0]}`
          })}
        </div>
        <h5 className="font-semibold">{title}</h5>
      </div>
      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {React.createElement(getIconComponent(item.icon), {
              className: `${index === 0 ? 'mr-1' : 'mx-1'} ${item.color}`
            })}{' '}
            {item.label}
            {index < items.length - 1 && ','}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AnimatedProjectSection;
