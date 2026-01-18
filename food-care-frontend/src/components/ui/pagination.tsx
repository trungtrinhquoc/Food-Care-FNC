import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";
import { cn } from "../../lib/utils";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  showInfo = true,
  showFirstLast = false,
  maxVisiblePages = 5,
  className,
  size = "sm",
  itemLabel = "mục",
}: PaginationProps) {
  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = totalItems ? ((currentPage - 1) * pageSize) + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Only show info when single page
  if (totalPages <= 1) {
    if (!showInfo || !totalItems) return null;
    return (
      <div className={cn("flex items-center justify-between mt-4", className)}>
        <div className="text-sm text-gray-500">
          Hiển thị {startItem} - {endItem} của {totalItems} {itemLabel}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between mt-4", className)}>
      {/* Info */}
      {showInfo && (
        <div className="text-sm text-gray-500">
          {totalItems ? (
            <>Hiển thị {startItem} - {endItem} của {totalItems} {itemLabel}</>
          ) : (
            <>Trang {currentPage} / {totalPages}</>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center gap-1">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size={size}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(1)}
            title="Trang đầu"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
        )}

        {/* Previous button */}
        <Button
          variant="outline"
          size={size}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          title="Trang trước"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Page numbers */}
        {getPageNumbers().map((page, index) =>
          typeof page === "number" ? (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size={size}
              onClick={() => onPageChange(page)}
              className={cn(
                currentPage === page && "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {page}
            </Button>
          ) : (
            <span key={index} className="px-2 text-gray-400">
              {page}
            </span>
          )
        )}

        {/* Next button */}
        <Button
          variant="outline"
          size={size}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          title="Trang sau"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size={size}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Trang cuối"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// Simple pagination with just prev/next buttons
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  totalItems,
  pageSize = 10,
  itemLabel = "mục",
}: Pick<PaginationProps, "currentPage" | "totalPages" | "onPageChange" | "className" | "totalItems" | "pageSize" | "itemLabel">) {
  const startItem = totalItems ? ((currentPage - 1) * pageSize) + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Show info even when single page
  if (totalPages <= 1) {
    if (!totalItems) return null;
    return (
      <div className={cn("flex items-center justify-between mt-4", className)}>
        <div className="text-sm text-gray-500">
          Hiển thị {startItem} - {endItem} của {totalItems} {itemLabel}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between mt-4", className)}>
      <div className="text-sm text-gray-500">
        {totalItems ? (
          <>Hiển thị {startItem} - {endItem} của {totalItems} {itemLabel}</>
        ) : (
          <>Trang {currentPage} / {totalPages}</>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

export default Pagination;
