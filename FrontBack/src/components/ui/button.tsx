import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#1a2a3a] disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#1a2a3a] text-white hover:bg-[#2a3f56]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700",
        outline:
          "border border-[#e5e7eb] bg-white text-[#1a2332] hover:bg-[#f3f5f7]",
        secondary:
          "bg-[#eef2f6] text-[#1a2332] hover:bg-[#e2e6ea]",
        ghost:
          "bg-transparent text-[#1a2332] hover:bg-[#f3f5f7]",
        link:
          "bg-transparent text-[#1a2a3a] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };