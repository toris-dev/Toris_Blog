import { cn } from '@/utils/style';
import { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export default function Wrapper({ children, className }: Props) {
  return <section className={cn(className, 'w-full')}>{children}</section>;
}
