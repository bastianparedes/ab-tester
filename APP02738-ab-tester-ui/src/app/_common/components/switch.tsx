import { cx } from 'class-variance-authority';
import type * as React from 'react';

function Switch({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      data-slot="input"
      className={cx(
        'appearance-none w-12 h-6 bg-gray-400 rounded-full relative transition-colors cursor-pointer shadow-md',
        'checked:bg-green-400',
        "before:content-[''] before:absolute before:top-1 before:left-1 before:w-4 before:h-4",
        'before:bg-gray-200 before:rounded-full before:transition-all',
        'before:shadow-lg',
        'checked:before:translate-x-6',
        'disabled:opacity-80',
        'disabled:cursor-not-allowed',
        className,
      )}
      {...props}
      type="checkbox"
    />
  );
}

export { Switch };
