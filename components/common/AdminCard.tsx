"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "bordered" | "highlighted";
  title?: string;
  description?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function AdminCard({
  className,
  children,
  variant = "default",
  title,
  description,
  subtitle,
  action,
  ...props
}: AdminCardProps) {
  const displayDescription = description || subtitle;
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl bg-white border border-gray-200 transition-all duration-200",
        variant === "bordered" &&
          "border-2 border-dashed border-gray-200 bg-transparent shadow-none",
        variant === "highlighted" && "bg-secondary/5 border-secondary/10",
        className,
      )}
      data-slot="admin-card"
      {...props}
    >
      {(title || displayDescription || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 pb-4 gap-4 border-b border-gray-50/50">
          <div className="space-y-1">
            {title && (
              <h3 className="font-semibold text-lg text-gray-900 tracking-tight">
                {title}
              </h3>
            )}
            {displayDescription && (
              <p className="text-sm text-gray-500">{displayDescription}</p>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {title || displayDescription || action ? (
        <div data-slot="admin-card-body" className="min-w-0 p-5 sm:p-6">{children}</div>
      ) : children}
    </div>
  );
}
