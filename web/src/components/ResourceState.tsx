interface ResourceStateProps {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message: string;
  onRetry?: () => void;
}

export function ResourceState({ kind, title, message, onRetry }: ResourceStateProps) {
  return (
    <div
      className={`resource-state resource-state--${kind}`}
      role={kind === 'error' ? 'alert' : undefined}
    >
      <span className="resource-state__symbol" aria-hidden="true">
        {kind === 'loading' ? '•••' : kind === 'error' ? '!' : '○'}
      </span>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <button className="button button--secondary" type="button" onClick={onRetry}>
          Reintentar
        </button>
      ) : null}
    </div>
  );
}
