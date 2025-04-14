'use client';

import { motion, useAnimation } from 'framer-motion';
import { FC, useEffect, useState } from 'react';

type SkillItemProps = {
  skill: string;
  percent: string;
  className: string;
};

const SkillItem: FC<SkillItemProps> = ({ skill, percent, className }) => {
  const controls = useAnimation();
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (isInView) {
      controls.start({
        width: `${percent}%`,
        transition: { duration: 1.5, type: 'spring', bounce: 0.3 }
      });
    }
  }, [controls, isInView, percent]);

  return (
    <ul className="w-full px-4">
      <motion.li
        className="my-5 flex w-full max-w-full flex-col items-start justify-between sm:flex-row sm:items-center md:w-[780px] lg:w-[980px]"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: '-100px' }}
        onViewportEnter={() => setIsInView(true)}
      >
        <div className="mb-2 text-xl font-semibold text-black dark:text-white sm:mb-0">
          {skill}
        </div>
        <div className="flex h-10 w-full flex-col justify-center rounded-l-lg border-r-4 bg-[#eee] px-0 shadow-xl dark:bg-gray-700 sm:w-70/100 md:w-[600px] lg:w-[800px]">
          <motion.div
            initial={{ width: 0 }}
            animate={controls}
            className={`flex h-10 items-center justify-end rounded-l-lg rounded-r-2xl bg-gradient-to-t from-[#fee9b2] to-[#ffc898] px-5 font-medium text-black`}
          >
            {percent}%
          </motion.div>
        </div>
      </motion.li>
    </ul>
  );
};

export default SkillItem;
