'use client';

import SkillItem from './SkillItem';

const Skills = () => {
  return (
    <article
      id="skills"
      className="flex w-full flex-col items-center justify-center bg-emerald-300 p-16"
    >
      <SkillItem percent="90" skill="HTML / CSS" className="w-90/100" />
      <SkillItem percent="80" skill="JAVASCRIPT" className="w-80/100" />
      <SkillItem percent="70" skill="TYPESCRIPT" className="w-70/100" />
      <SkillItem percent="80" skill="REACT.JS" className="w-80/100" />
      <SkillItem percent="70" skill="REACT-QUERY" className="w-70/100" />
      <SkillItem percent="90" skill="NEXT.JS" className="w-90/100" />
      <SkillItem percent="90" skill="GIT / GITHUB" className="w-90/100" />
    </article>
  );
};

export default Skills;
