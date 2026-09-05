import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-[#9ca3af] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#1a2a3a] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
