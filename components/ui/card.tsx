import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "danger";
}

export function Card({ variant = "default", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6",
        variant === "danger" && "border-destructive/50",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn("font-semibold", className)}
      {...props}
    />
  );
}
