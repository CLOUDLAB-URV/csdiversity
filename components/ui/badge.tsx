import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "secondary"
      ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
      : variant === "outline"
      ? "border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200"
      : "bg-blue-600 text-white";

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        variantClass,
        className
      )}
      {...props}
    />
  );
}






