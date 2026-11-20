import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ModuleCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "bordered" | "highlighted";
  title?: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
}

/** Module cards keep children in the same layout context as padding and gap utilities. */
export function ModuleCard({
  children, className, variant = "default", title, description, subtitle, action, ...props
}: ModuleCardProps) {
  const summary = description || subtitle;
  return (
    <div
      data-slot="module-card"
      className={cn(
        "min-w-0 rounded-xl border border-gray-200 bg-white",
        (title || summary) && "space-y-5 p-5 sm:p-6",
        variant === "bordered" && "border-dashed bg-transparent",
        variant === "highlighted" && "border-secondary/20 bg-secondary/5",
        className,
      )}
      {...props}
    >
      {(title || summary || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="min-w-0 space-y-1">
            {title && <h2 className="text-base font-semibold text-gray-900">{title}</h2>}
            {summary && <p className="text-sm leading-relaxed text-gray-500">{summary}</p>}
          </div>
          {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
