'use client';

import { AiOutlineClose } from '@react-icons/all-files/ai/AiOutlineClose';
import { AiOutlineMenu } from '@react-icons/all-files/ai/AiOutlineMenu';
import { AiOutlineRobot } from '@react-icons/all-files/ai/AiOutlineRobot';
import { AiOutlineSetting } from '@react-icons/all-files/ai/AiOutlineSetting';
import { BsPencilSquare } from '@react-icons/all-files/bs/BsPencilSquare';
import { GiBookCover } from '@react-icons/all-files/gi/GiBookCover';
import Link from 'next/link';
import { FC } from 'react';
import IconButton from './IconButton';
import { useSidebar } from './Providers';
const Header: FC = () => {
  const { isOpen, setIsOpen } = useSidebar();
  return (
    <header
      className={`flex h-16 w-full items-center justify-between border-b px-4 lg:px-10`}
    >
      <IconButton
        onClick={() => setIsOpen((prev) => !prev)}
        Icon={isOpen ? AiOutlineClose : AiOutlineMenu}
        label="sidebarToggle"
        id="sidebarToggle"
        aria-label="sidebarToggle"
      />
      <Link href="/">
        <h1 className="text-3xl font-medium text-slate-600">Blog</h1>
      </Link>

      <div className="flex items-center gap-2 lg:gap-3">
        <IconButton
          Icon={GiBookCover}
          component={Link}
          href="/guestbook"
          className="text-gray-500 hover:text-gray-600"
          label="guestbook"
          id="guestbook"
          aria-label="guestbook"
        />
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">Admin</div>
        <IconButton
          Icon={AiOutlineSetting}
          component={Link}
          href="/admin"
          className="text-gray-500 hover:text-gray-600"
          label="adminLink"
          id="adminlink"
          aria-label="adminlink"
        />
        <IconButton
          Icon={BsPencilSquare}
          component={Link}
          href="/write"
          className="pr-10 text-gray-500 hover:text-gray-600"
          label="writeLink"
          id="writeLink"
          aria-label="writeLink"
        />
        <IconButton
          Icon={AiOutlineRobot}
          component={Link}
          href="/search"
          label="chatbotLink"
          id="chatbotLink"
          aria-label="chatbotLink"
        />
      </div>
    </header>
  );
};

export default Header;
