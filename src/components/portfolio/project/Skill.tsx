'use client';

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
    <div className="flex">
      <p className="text-orange-500">{title}</p>
      {type ? (
        <Link
          href={url as Url}
          className="inline text-sky-400 hover:underline"
          target="_blank"
        >
          {url}
        </Link>
      ) : (
        <span>{tech}</span>
      )}
    </div>
  );
};

export default Skill;
