import Link from 'next/link';
import { Dispatch, FC, SetStateAction } from 'react';
import { AiOutlineClose, AiOutlineMenu } from 'react-icons/ai';
import { BsRobot } from 'react-icons/bs';

type HeaderProps = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: Dispatch<SetStateAction<boolean>>;
};
const Header: FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4 lg:px-10">
      <button className="p-2" onClick={() => setIsSidebarOpen((prev) => !prev)}>
        {isSidebarOpen ? (
          <AiOutlineClose className="size-5 lg:size-6" />
        ) : (
          <AiOutlineMenu className="size-5 lg:size-6" />
        )}
      </button>
      <Link href="/">
        <h1 className="text-3xl font-medium text-slate-600">Blog</h1>
      </Link>

      <Link href="/search">
        <BsRobot className="size-5 lg:size-6" />
      </Link>
    </header>
  );
};

export default Header;
