'use client';

import Link from 'next/link';
import { FC } from 'react';
import {
  AiOutlineClose,
  AiOutlineMenu,
  AiOutlineSetting
} from 'react-icons/ai';
import { BsPencilSquare, BsRobot } from 'react-icons/bs';
import IconButton from './IconButton';
import { useSidebar } from './Providers';

const Header: FC = () => {
  const { isOpen, setIsOpen } = useSidebar();
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 lg:px-10">
      <IconButton
        onClick={() => setIsOpen((prev) => !prev)}
        Icon={isOpen ? AiOutlineClose : AiOutlineMenu}
        label="sidebarToggle"
      />
      <Link href="/">
        <h1 className="text-3xl font-medium text-slate-600">Blog</h1>
      </Link>

      <div className="flex items-center gap-2 lg:gap-3">
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">Admin</div>
        <IconButton
          Icon={AiOutlineSetting}
          component={Link}
          href="/admin"
          className="text-gray-500 hover:text-gray-600"
          label="adminLink"
        />
        <IconButton
          Icon={BsPencilSquare}
          component={Link}
          href="/write"
          className="pr-10 text-gray-500 hover:text-gray-600"
          label="writeLink"
        />
        <IconButton
          Icon={BsRobot}
          component={Link}
          href="/search"
          label="chatbotLink"
        />
      </div>
    </header>
  );
};

export default Header;
