import { cx } from 'class-variance-authority';
import type React from 'react';

// Types for button variants
type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

// Button variants
const buttonVariants: Record<'variant' | 'size', Record<string, string>> = {
  size: {
    default: 'h-9 px-4 py-2',
    icon: 'w-9 h-9',
    'icon-lg': 'w-10 h-10',
    'icon-sm': 'w-8 h-8',
    lg: 'h-10 rounded-md px-6',
    sm: 'h-8 rounded-md gap-1.5 px-3',
  },
  variant: {
    default: 'bg-blue-600 text-white hover:enabled:bg-blue-700',
    destructive: 'bg-red-500 text-white hover:enabled:bg-red-600 focus-visible:ring-red-200 dark:focus-visible:ring-red-900 dark:bg-red-600',
    ghost: 'hover:enabled:bg-gray-100 hover:enabled:text-gray-900 dark:hover:enabled:bg-gray-800',
    link: 'text-blue-600 underline-offset-4 hover:enabled:underline',
    outline:
      'border border-gray-300 bg-white shadow-sm hover:enabled:bg-gray-100 hover:enabled:text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:hover:enabled:bg-gray-700',
    secondary: 'bg-gray-200 text-gray-900 hover:enabled:bg-gray-300',
  },
};

// Button component props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
}

export const Button = ({ className, variant = 'default', size = 'default', children, href, ...props }: ButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-80 disabled:cursor-not-allowed';

  const variantClass = buttonVariants.variant[variant] ?? buttonVariants.variant.default;

  const sizeClass = buttonVariants.size[size] ?? buttonVariants.size.default;

  if (href)
    return (
      <a href={href} className={cx(className, baseClasses, variantClass, sizeClass)}>
        {children}
      </a>
    );

  return (
    <button className={cx(className, baseClasses, variantClass, sizeClass)} {...props}>
      {children}
    </button>
  );
};
