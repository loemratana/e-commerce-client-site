type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Accessible name of the nav, e.g. "Wishlist pages". */
  label?: string;
  disabled?: boolean;
};

const Pagination = ({
  page,
  totalPages,
  onPageChange,
  label = "Review pages",
  disabled = false,
}: PaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={label}
      className="flex items-center justify-between gap-4"
    >
      <button
        type="button"
        disabled={disabled || page <= 0}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-gray-3 px-4 py-2 text-sm font-medium text-dark hover:border-blue disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <span className="text-sm text-gray-600">
        Page {page + 1} of {totalPages}
      </span>
      <button
        type="button"
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-gray-3 px-4 py-2 text-sm font-medium text-dark hover:border-blue disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
