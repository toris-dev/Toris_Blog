'use client';

import { useCategories } from '@/utils/hooks';
import { cn } from '@/utils/style';
import { AiFillGithub } from '@react-icons/all-files/ai/AiFillGithub';
import { AiOutlineClose } from '@react-icons/all-files/ai/AiOutlineClose';
import Link from 'next/link';
import IconButton from './IconButton';
import { useSidebar } from './Providers';
type SidebarProps = {
  close: () => void;
  isOpen: boolean;
};
// Sidebar.tsx
const Sidebar = () => {
  const { isOpen, setIsOpen } = useSidebar();
  const { data: existingCategories } = useCategories();

  return (
    <div
      className={cn(
        'absolute z-10 flex min-h-screen flex-col gap-6 border-r bg-white py-10 text-center lg:relative',
        isOpen
          ? 'size-auto overflow-visible opacity-100'
          : 'size-0 overflow-hidden opacity-0'
      )}
      style={{
        transition:
          'opacity 0.3s ease-in-out, transform 0.3s ease-in-out, height 0.3s ease-in-out',
        transform: isOpen
          ? 'translateX(0%)'
          : 'translateX(-100%) translateY(0)',
        height: isOpen ? 'auto' : '0'
      }}
    >
      <div className="flex cursor-pointer justify-end lg:hidden">
        <IconButton
          Icon={AiOutlineClose}
          onClick={() => setIsOpen(false)}
          label="sidebarClose"
        />
      </div>
      <Link
        href="/portfolio"
        className="w-48 font-medium text-gray-600 hover:underline"
      >
        Portfolio
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
      <div className="mt-10 flex items-center justify-center gap-4">
        <IconButton
          Icon={AiFillGithub}
          component={Link}
          href="https://github.com/toris-dev"
          target="_blank"
          label="githubLink"
          aria-label="toris-dev github Link"
        />
      </div>
      <a
        href="https://github.com/toris-dev"
        className="flex items-center justify-center"
        aria-label="toris-dev github Link"
      >
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
