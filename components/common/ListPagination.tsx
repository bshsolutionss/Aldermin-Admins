"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface ListPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalRecords: number;
  pageSize: number;
}

export function ListPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalRecords,
  pageSize,
}: ListPaginationProps) {
  const start = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRecords);
  const pages = Array.from(new Set([
    1, currentPage - 1, currentPage, currentPage + 1, totalPages,
  ].filter(page => page >= 1 && page <= totalPages))).sort((a, b) => a - b);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-900">{start}</span> to{" "}
        <span className="font-medium text-gray-900">{end}</span> of{" "}
        <span className="font-medium text-gray-900">{totalRecords}</span>{" "}
        results
      </div>

      <nav aria-label="Table pagination" className="flex max-w-full flex-wrap items-center gap-1">
        <Button
          type="button"
          aria-label="Previous page"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 w-8 p-0"
        >
          <FaChevronLeft size={12} />
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((page, index) => (
            <React.Fragment key={page}>
            {index > 0 && page - pages[index - 1] > 1 && <span aria-hidden="true" className="px-1 text-gray-400">…</span>}
            <Button
              type="button"
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
              key={page}
              variant={currentPage === page ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(page)}
              className={`h-8 w-8 p-0 text-xs font-medium ${
                currentPage === page
                  ? "bg-secondary text-white hover:bg-secondary/90"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {page}
            </Button>
            </React.Fragment>
          ))}
        </div>

        <Button
          type="button"
          aria-label="Next page"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 w-8 p-0"
        >
          <FaChevronRight size={12} />
        </Button>
      </nav>
    </div>
  );
}
