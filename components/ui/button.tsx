import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition disabled:opacity-50",
          // Variants
          variant === "primary" &&
            "bg-primary text-primary-foreground hover:bg-primary/90",
          variant === "outline" &&
            "border border-border hover:bg-accent",
          variant === "danger" &&
            "border border-destructive text-destructive hover:bg-destructive/10",
          variant === "ghost" &&
            "hover:bg-accent",
          // Sizes
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-2.5 text-base",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
