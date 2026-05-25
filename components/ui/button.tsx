import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type ReactElement, cloneElement, Children } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  ghost: "hover:bg-accent hover:text-accent-foreground",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  asChild?: boolean;
}

const sizeClass = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm", lg: "h-10 px-6 text-sm" };

export function Button({ variant = "primary", size = "md", className, children, asChild, ...props }: ButtonProps) {
  const classes = cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variantClass[variant],
    sizeClass[size],
    className
  );

  if (asChild && children) {
    const child = Children.only(children) as ReactElement<{ className?: string; children?: React.ReactNode }>;
    return cloneElement(child, {
      ...props,
      className: cn(classes, (child.props as { className?: string }).className),
    });
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
}
