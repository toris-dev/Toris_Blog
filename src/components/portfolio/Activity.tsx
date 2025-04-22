'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Carousel from 'react-material-ui-carousel';

const Activity = () => {
  const imgs = [
    {
      src: '/portfolio/activityImg/엘리스 우수 수료증.jpg',
      alt: '엘리스 우수 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">엘리스 우수 수료증</b>
          <p>엘리스에서 400시간이라는 교육시간을 성실하게 이수하였습니다.</p>
          <p>
            JS기반으로 프론트, 백엔드에 대해서 살펴봤으며, 최신 기술트렌드를
            실습으로 사용하였습니다.
          </p>
        </div>
      )
    },
    {
      src: '/portfolio/activityImg/EC-22-76028982_유주환_[고급] 웹 개발 프로젝트.jpg',
      alt: '엘리스 고급 웹 개발 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">엘리스 우수 수료증</b>
          <p>
            JS 고급개념을 클로저, 익명함수, 프로토타입에 대해서 알아보는
            시간이었습니다.
          </p>
          <p>
            JS 고급개념을 익힌 후 프론트엔드 React, 백엔드 Express 를 기반으로
            풀스택 개발을 진행하였습니다.
          </p>
        </div>
      )
    },
    {
      src: '/portfolio/activityImg/엘리스_웹개발 중급 수료증.jpg',
      alt: '엘리스 SW[중급] 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">엘리스 SW[중급] 수료증</b>
          <p>
            Express를 이용하여 백엔드 로직이 어떤식으로 구성되는지
            데이터베이스를 연동하여 데이터처리와 미들웨어 처리에 대해서
            학습했습니다.
          </p>
          <p>
            JS기반으로 프론트, 백엔드에 대해서 살펴봤으며, 최신 기술트렌드를
            실습으로 사용하였습니다.
          </p>
        </div>
      )
    },
    {
      src: '/portfolio/activityImg/구름 AI 군장병 웹개발 고급 수료증_page-0001.jpg',
      alt: '구름 SW[고급] 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">구름 SW[고급] 수료증</b>
          <p>엘리스에서 400시간이라는 교육시간을 성실하게 이수하였습니다.</p>
          <p>
            JS기반으로 프론트, 백엔드에 대해서 살펴봤으며, 최신 기술트렌드를
            실습으로 사용하였습니다.
          </p>
        </div>
      )
    },
    {
      src: '/portfolio/activityImg/구름 AI 군장병 SW개발 고급과정 수료증_page-0001.jpg',
      alt: '구름 SW[고급] 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">구름 SW[고급] 수료증</b>
          <p>엘리스에서 400시간이라는 교육시간을 성실하게 이수하였습니다.</p>
          <p>
            JS기반으로 프론트, 백엔드에 대해서 살펴봤으며, 최신 기술트렌드를
            실습으로 사용하였습니다.
          </p>
        </div>
      )
    },
    {
      src: '/portfolio/activityImg/구름 SW 개발 프로젝트 과정2.jpg',
      alt: '구름 SW개발 프로젝트 수료증',
      description: (
        <div className="text-black dark:text-white">
          <b className="text-xl">구름 SW개발 하반기 프로젝트 수료증</b>
          <p>구름에서 진행한 SW개발 하반기 프로젝트 참여</p>
          <p>
            백엔드는 Express + Graphql + mongodb + mongoose 를 사용하여 단일
            엔드포인트로 구축하였습니다.
          </p>
          <p>
            프론트엔드는 React Native, Expo SDK 를 이용하여 쉼터 앱을
            만들었습니다.
          </p>
          <span>
            저는 백엔드로 참가하여 개발을 진행하는 도중 프론트엔드분들의 부재로
            인해 저는 프론트엔드 업무 또한 병행하였습니다.
          </span>
          <span>
            저는 React 지식도 겸비하고 있었기에 React Native를 어떤구조로
            개발해야하는지 학습 후 개발에 돌입하였습니다. <br />
            1달이라는 촉박한 시간과 군대에서 진행한 프로젝트였기에 시간과 환경이
            좋지 않았지만 개발에 대한 생각을 가장 많이할 수 있었습니다. <br />
            개발에 몰입하여 진행했던 프로젝트여서 가장 기억에 남는
            프로젝트입니다.
          </span>
        </div>
      )
    }
  ];

  return (
    <motion.article
      id="activity"
      className="flex w-full justify-center py-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true }}
    >
      <div className="w-full px-4">
        <motion.h3
          className="mb-8 text-center text-3xl font-semibold text-black dark:text-white"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Activity
        </motion.h3>

        <Carousel
          animation="slide"
          className="flex min-h-[500px] w-full flex-col items-center justify-center md:min-h-[600px] lg:min-h-[700px]"
          navButtonsAlwaysVisible
          autoPlay={false}
          indicators={true}
        >
          {imgs.map((img) => (
            <motion.div
              key={img.alt}
              className="mx-auto flex max-w-full flex-col items-center justify-center rounded-xl bg-white p-4 dark:bg-gray-800 lg:max-w-6xl lg:flex-row lg:p-6"
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.3 }}
            >
              <div className="relative mb-4 lg:mb-0">
                <Image
                  src={img.src}
                  alt="activityImg"
                  width={400}
                  height={400}
                  className="h-auto max-w-full rounded-lg object-contain shadow-md lg:max-w-[400px]"
                />
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-blue-400"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  animate={{
                    scale: [1, 1.02, 1],
                    rotate: [0, 0.5, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse'
                  }}
                />
              </div>
              <div className="max-w-full pl-0 lg:max-w-[600px] lg:pl-6">
                {img.description}
              </div>
            </motion.div>
          ))}
        </Carousel>
      </div>
    </motion.article>
  );
};

export default Activity;
