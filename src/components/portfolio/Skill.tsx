'use client';

import { motion } from 'framer-motion';
import SkillItem from './SkillItem';

const Skills = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <motion.article
      id="skills"
      className="flex min-h-[600px] w-full flex-col items-center justify-center py-16"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      variants={container}
    >
      <motion.h3
        className="mb-12 text-3xl font-semibold text-black dark:text-white"
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Skills
      </motion.h3>
      <div className="flex w-full flex-col items-center justify-center gap-1">
        <SkillItem percent="90" skill="HTML / CSS" className="w-90/100" />
        <SkillItem percent="80" skill="JAVASCRIPT" className="w-80/100" />
        <SkillItem percent="70" skill="TYPESCRIPT" className="w-70/100" />
        <SkillItem percent="80" skill="REACT.JS" className="w-80/100" />
        <SkillItem percent="70" skill="REACT-QUERY" className="w-70/100" />
        <SkillItem percent="90" skill="NEXT.JS" className="w-90/100" />
        <SkillItem percent="90" skill="GIT / GITHUB" className="w-90/100" />
      </div>
    </motion.article>
  );
};

export default Skills;
