'use client';

import { motion } from 'framer-motion';
import { FC, ReactNode } from 'react';

type AboutBoxItemProps = {
  emoji: string;
  title: string;
  desc: string | ReactNode;
};

type AboutBoxProps = {
  info: AboutBoxItemProps[];
};

const AboutBox: FC<AboutBoxProps> = ({ info }) => {
  return (
    <div className="flex w-full flex-col justify-evenly gap-4 p-4 md:flex-row md:p-8">
      {info.map((item, index) => (
        <motion.div
          key={index}
          className="flex w-full flex-col items-center rounded-xl border bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gray-800 dark:text-white md:w-64"
          whileHover={{ scale: 1.05 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <motion.div
            className="mb-4 text-4xl"
            whileHover={{ scale: 1.2, rotate: [0, 5, -5, 0] }}
            transition={{ duration: 0.5 }}
          >
            {item.emoji}
          </motion.div>
          <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
          <div className="text-center text-gray-600 dark:text-gray-300">
            {item.desc}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default AboutBox;
