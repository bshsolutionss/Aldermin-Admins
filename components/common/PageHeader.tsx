"use client";

import React from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { FaChevronLeft } from "react-icons/fa";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backUrl?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backUrl,
  action,
  icon,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-4 mb-6", className)}>
      {backUrl && (
        <Link
          href={backUrl}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <FaChevronLeft size={12} />
          Back
        </Link>
      )}

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="text-gray-900">{icon}</div>}
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm md:text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="flex max-w-full flex-wrap items-center gap-2 [&>div]:flex-wrap">{action}</div>}
      </div>
    </div>
  );
}
