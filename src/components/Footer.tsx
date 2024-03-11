import Link from 'next/link';
import { FC } from 'react';
import { AiOutlineSetting } from 'react-icons/ai';
import { BsPencilSquare } from 'react-icons/bs';
const Footer: FC = () => {
  return (
    <header className="flex justify-between border-t p-4 font-medium">
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">ABOUT ME</div>
        <div className="text-xs">Full-Stack-Engineer Toris</div>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">Admin</div>
        <Link href="/admin">
          <AiOutlineSetting />
        </Link>
        <Link href="/write">
          <BsPencilSquare />
        </Link>
      </div>
    </header>
  );
};

export default Footer;
