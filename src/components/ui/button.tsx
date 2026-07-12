import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Glintr Button system.
 * Variants map to the CTA hierarchy across the platform.
 * Never hardcode colors — every visual comes from design tokens.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold",
    "rounded-lg select-none cursor-pointer",
    "transition-[transform,box-shadow,background-color,color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:-translate-y-px hover:shadow-md active:translate-y-0",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/85 hover:-translate-y-px",
        outline:
          "border border-border-strong bg-transparent text-foreground hover:bg-accent hover:border-primary/40",
        ghost:
          "bg-transparent text-foreground hover:bg-accent hover:text-accent-foreground",
        link: "bg-transparent text-primary underline-offset-4 hover:underline p-0 h-auto",
        danger:
          "bg-danger text-danger-foreground shadow-sm hover:bg-danger/90 hover:-translate-y-px",
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:-translate-y-px",
        gradient:
          "bg-gradient-brand animate-gradient text-primary-foreground shadow-lg hover:-translate-y-0.5 hover:shadow-xl [background-size:200%_200%]",
        glow:
          "bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:shadow-xl",
        soft:
          "bg-primary-soft text-primary hover:bg-primary/15",
      },
      size: {
        xs: "h-8 px-3 text-xs rounded-md [&_svg]:size-3.5",
        sm: "h-9 px-3.5 text-sm rounded-md",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-[15px] rounded-xl",
        xl: "h-14 px-8 text-base rounded-xl [&_svg]:size-5",
        icon: "size-10 rounded-lg",
        "icon-sm": "size-8 rounded-md [&_svg]:size-3.5",
        "icon-lg": "size-12 rounded-xl [&_svg]:size-5",
      },
      block: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, block, asChild = false, loading, disabled, children, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const isDisabled = disabled || loading;
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, block }), className)}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span className="opacity-80">{children ?? "Loading"}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
