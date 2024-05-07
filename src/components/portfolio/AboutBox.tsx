'use client';

import { IconType } from '@react-icons/all-files';
import Link from 'next/link';
import { FC } from 'react';

type AboutBoxProps = {
  icon: IconType;
  title: string;
  description: string;
  type?: string;
};
const AboutBox: FC<AboutBoxProps> = ({
  icon: Icon,
  title,
  description,
  type
}) => {
  return (
    <article className="flex gap-4">
      <Icon size={32} />
      <div className="flex flex-col gap-2">
        <h4 className="text-xl font-bold text-slate-600">{title}</h4>
        {type ? (
          <div>
            <Link
              href="mailto:ironjustlikethat@gmail.com"
              className="hover:text-red-300"
            >
              {description}
            </Link>
          </div>
        ) : (
          <p>{description}</p>
        )}
      </div>
    </article>
  );
};

export default AboutBox;
