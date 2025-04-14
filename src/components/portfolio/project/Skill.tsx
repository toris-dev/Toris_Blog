'use client';

import { motion } from 'framer-motion';
import { Url } from 'next/dist/shared/lib/router/router';
import Link from 'next/link';
import { FC } from 'react';

type SkillProps = {
  title: string;
  tech?: string;
  type?: string;
  url?: string;
};

const Skill: FC<SkillProps> = ({ title, tech, type, url }) => {
  return (
    <motion.div
      className="flex flex-wrap items-center"
      initial={{ opacity: 0, x: -5 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ x: 3 }}
    >
      <p className="mr-1 text-sm font-medium text-orange-500 md:text-base">
        {title}
      </p>
      {type ? (
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Link
            href={url as Url}
            className="inline break-all text-sm text-sky-400 hover:underline md:text-base"
            target="_blank"
          >
            {url}
          </Link>
        </motion.div>
      ) : (
        <motion.span
          className="break-words text-sm text-gray-800 dark:text-gray-200 md:text-base"
          whileHover={{ color: ['#f59e0b', '#10b981', '#3b82f6', '#f59e0b'] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {tech}
        </motion.span>
      )}
    </motion.div>
  );
};

export default Skill;
