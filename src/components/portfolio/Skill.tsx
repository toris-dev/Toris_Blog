'use client';

import SkillItem from './SkillItem';

const Skills = () => {
  return (
    <article
      id="skills"
      className="flex h-[700px] w-full flex-col items-center justify-center"
    >
      <h3 className="mb-5 text-2xl font-semibold">Skills</h3>
      <div className="flex flex-col items-center justify-center gap-1">
        <SkillItem percent="90" skill="HTML / CSS" className="w-90/100" />
        <SkillItem percent="80" skill="JAVASCRIPT" className="w-80/100" />
        <SkillItem percent="70" skill="TYPESCRIPT" className="w-70/100" />
        <SkillItem percent="80" skill="REACT.JS" className="w-80/100" />
        <SkillItem percent="70" skill="REACT-QUERY" className="w-70/100" />
        <SkillItem percent="90" skill="NEXT.JS" className="w-90/100" />
        <SkillItem percent="90" skill="GIT / GITHUB" className="w-90/100" />
      </div>
    </article>
  );
};

export default Skills;
