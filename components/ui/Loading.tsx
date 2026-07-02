/**
 * Loading Component
 * Simple loading spinner or message
 */
interface LoadingProps {
  message?: string;
  className?: string;
}

export function Loading({ message = 'Memuat…', className = '' }: LoadingProps) {
  return (
    <div className={`loading ${className}`} style={{ textAlign: 'center', padding: '2rem' }}>
      <p style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
  );
}
