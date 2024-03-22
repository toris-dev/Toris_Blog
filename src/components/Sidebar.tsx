'use client';

import { useCategories } from '@/utils/hooks';
import { cn } from '@/utils/style';
import Link from 'next/link';
import { AiFillGithub, AiOutlineClose } from 'react-icons/ai';
import IconButton from './IconButton';
import { useSidebar } from './Providers';
type SidebarProps = {
  close: () => void;
  isOpen: boolean;
};

const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { data: existingCategories } = useCategories();
  return (
    <div
      className={cn(
        'absolute z-10 min-h-screen flex-col gap-6 border-r bg-white py-10 pl-10 lg:relative',
        isOpen ? 'flex' : 'hidden'
      )}
    >
      <div className="flex cursor-pointer justify-end lg:hidden">
        <IconButton
          Icon={AiOutlineClose}
          onClick={() => setIsOpen(false)}
          label="sidebarClose"
        />
      </div>
      <Link href="/" className="w-48 font-medium text-gray-600 hover:underline">
        홈
      </Link>
      <Link
        href="/tags"
        className="w-48 font-medium text-gray-600 hover:underline"
      >
        태그
      </Link>
      {existingCategories?.map((category) => (
        <Link
          href={`/categories/${category}`}
          className="w-48 font-medium text-gray-600 hover:underline"
          key={category}
        >
          {category}
        </Link>
      ))}
      <div className="mt-10 flex items-center gap-4">
        <IconButton
          Icon={AiFillGithub}
          component={Link}
          href="https://github.com/toris-dev"
          target="_blank"
          label="githubLink"
        />
      </div>
      <a href="https://hits.seeyoufarm.com">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fnextjs-blog-torisblog.vercel.app&count_bg=%2379C83D&title_bg=%23000000&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false"
          alt="방문자 뱃지"
        />
      </a>
    </div>
  );
};

export default Sidebar;
