import { cn } from '@/utils/style';
import Link from 'next/link';
import { FC } from 'react';
import { AiFillGithub, AiOutlineClose } from 'react-icons/ai';
import IconButton from './IconButton';
type SidebarProps = {
  close: () => void;
  isOpen: boolean;
};
const Sidebar: FC<SidebarProps> = ({ isOpen, close }) => {
  return (
    <div
      className={cn(
        'absolute z-10 min-h-screen flex-col gap-6 border-r bg-white py-10 pl-10 lg:relative',
        isOpen ? 'flex' : 'hidden'
      )}
    >
      <div className="flex cursor-pointer justify-end lg:hidden">
        <IconButton Icon={AiOutlineClose} onClick={close} />
      </div>
      <Link href="/" className="w-48 font-medium text-gray-600 hover:underline">
        Home
      </Link>
      <Link
        href="/tag"
        className="w-48 font-medium text-gray-600 hover:underline"
      >
        Tag
      </Link>
      <Link
        href="/category/Web-Development"
        className="w-48 font-medium text-gray-600 hover:underline"
      >
        Web Development
      </Link>
      <div className="mt-10 flex items-center gap-4">
        <IconButton
          Icon={AiFillGithub}
          component={Link}
          href="https://github.com/toris-dev"
          target="_blank"
        />
      </div>
    </div>
  );
};

export default Sidebar;
