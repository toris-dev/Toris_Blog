'use client';

import { motion } from 'framer-motion';
import AboutBox from './AboutBox';

const About = () => {
  const aboutBoxInfo = [
    {
      emoji: '🎓',
      title: '학력',
      desc: (
        <div>
          <p>학점은행제 학사</p>
          <p>2020.03 ~ 2025.08(졸업)</p>
        </div>
      )
    },
    {
      emoji: '🏠',
      title: '거주지',
      desc: '대한민국 서울'
    },
    {
      emoji: '💼',
      title: '경력',
      desc: (
        <div>
          <p>(주)셈웨어</p>
          <p>2024.08 ~ (1년차)</p>
        </div>
      )
    }
  ];

  return (
    <motion.article
      id="about"
      className="flex w-full flex-1 flex-col py-16"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      <motion.h2
        className="mb-8 py-5 text-center text-3xl font-semibold text-black dark:text-white"
        initial={{ y: -50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3, type: 'spring' }}
      >
        About me
      </motion.h2>
      <div className="flex justify-evenly">
        <AboutBox info={aboutBoxInfo} />
      </div>
    </motion.article>
  );
};

export default About;
