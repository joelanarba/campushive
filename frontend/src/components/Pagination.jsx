export const Pagination = ({ pagination, onPageChange, disabled = false }) => {
  if (!pagination || pagination.total_pages <= 1) return null;
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 p-4 text-sm">
      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-40"
        disabled={disabled || pagination.page <= 1}
        onClick={() => onPageChange(pagination.page - 1)}>
        Previous
      </button>
      <span>
        Page {pagination.page} of {pagination.total_pages} · {pagination.total}{" "}
        results
      </span>
      <button
        type="button"
        className="rounded border px-3 py-2 disabled:opacity-40"
        disabled={disabled || pagination.page >= pagination.total_pages}
        onClick={() => onPageChange(pagination.page + 1)}>
        Next
      </button>
    </nav>
  );
};
