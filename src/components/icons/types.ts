import { SVGProps } from 'react';

export interface IconBaseProps extends SVGProps<SVGSVGElement> {
  children?: React.ReactNode;
  size?: string | number;
  color?: string;
  title?: string;
}

export type IconType = (props: IconBaseProps) => JSX.Element;
