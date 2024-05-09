'use client';

import { FC } from 'react';

type SkillItemProps = {
  skill: string;
  percent: string;
  className: string;
};
const SkillItem: FC<SkillItemProps> = ({ skill, percent, className }) => {
  return (
    <ul>
      <li className="my-5 flex w-[980px] justify-between ">
        <div className="font-semibold">{skill}</div>
        <div className="m-0 flex w-[800px] flex-col justify-center border-r-4 bg-[#eee] px-0 shadow-xl">
          <div
            className={`${className} flex animate-pulse items-center justify-end rounded-r-2xl bg-gradient-to-t from-[#fee9b2] to-[#ffc898] px-5`}
          >
            {percent}%
          </div>
        </div>
      </li>
    </ul>
  );
};

export default SkillItem;
