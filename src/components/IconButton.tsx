import { cn } from '@/utils/style';
import { ComponentPropsWithRef, ElementType, createElement } from 'react';
import { IconType } from 'react-icons';

type IconButtonProps<Component extends ElementType> =
  ComponentPropsWithRef<Component> & {
    Icon: IconType;
    iconClassName?: string;
    className?: string;
    component?: Component;
  };

// Component 가 무엇이냐에 따라 generic 으로 타입을 추론할 수 있게 지원.
const IconButton = <Component extends ElementType = 'button'>({
  component,
  className,
  iconClassName,
  Icon,
  ...props
}: IconButtonProps<Component>) => {
  return createElement(
    component ?? 'button',
    {
      className: cn('p-1.5 lg:p-2', className),
      ...props
    },
    <Icon className={(cn('size-5 transition-all lg:size-6'), iconClassName)} />
  );
};

export default IconButton;
