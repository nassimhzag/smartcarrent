import { useEffect } from 'react';

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-stack" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const iconForType = (type) => {
    if (type === 'success') return '✓';
    if (type === 'error') return '✕';
    return 'ℹ';
  };

  return (
    <div className={`toast toast-${toast.type || 'info'}`}>
      <span className="toast-icon" aria-hidden="true">
        {iconForType(toast.type)}
      </span>
      <p className="toast-message">{toast.message}</p>
      <button
        type="button"
        className="toast-close"
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
      >
        ×
      </button>
    </div>
  );
}
