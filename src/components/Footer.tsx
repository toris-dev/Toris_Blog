import { FC } from 'react';
const Footer: FC = () => {
  return (
    <header className="flex justify-between border-t p-4 font-medium">
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">ABOUT ME</div>
        <div className="text-xs">Full-Stack-Engineer Toris</div>
      </div>
      <div className="flex items-center gap-2 lg:gap-3">
        <div className="pr-1 text-sm lg:pr-2 lg:text-base">Toris-dev</div>
      </div>
    </header>
  );
};

export default Footer;
