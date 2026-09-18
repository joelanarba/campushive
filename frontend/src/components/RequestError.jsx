export const RequestError = ({ error, onRetry }) =>
  error ? (
    <div
      role="alert"
      className="my-3 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
      <p>{error}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-2 underline">
          Try again
        </button>
      )}
    </div>
  ) : null;
