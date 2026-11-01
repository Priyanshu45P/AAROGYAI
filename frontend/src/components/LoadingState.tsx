export function LoadingState({ message = "Loading information..." }: { message?: string }) {
  return (
    <div className="card state-card" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <div>
        <strong>{message}</strong>
        <p className="muted">Please wait a moment.</p>
      </div>
    </div>
  );
}
