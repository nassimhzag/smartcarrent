import { useCallback, useState } from 'react';

let nextToastId = 1;

export default function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', duration = 3500) => {
    const id = nextToastId++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const success = useCallback((message, duration) => push(message, 'success', duration), [push]);
  const error = useCallback((message, duration) => push(message, 'error', duration || 5000), [push]);
  const info = useCallback((message, duration) => push(message, 'info', duration), [push]);

  return { toasts, push, success, error, info, dismiss };
}
