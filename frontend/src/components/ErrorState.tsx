export function ErrorState({
  message = "We could not load this information.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card state-card error-state" role="alert">
      <div>
        <strong>Something went wrong</strong>
        <p>{message}</p>
      </div>
      {onRetry && (
        <button className="secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
