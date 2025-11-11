import { useToast } from '../contexts/ToastContext';
import { useEffect, useRef } from 'react';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-md w-full">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  };
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Remove após 4 segundos por padrão
    timerRef.current = setTimeout(() => {
      onRemove(toast.id);
    }, 4000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [toast.id, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/90 border-green-400 text-white';
      case 'error':
        return 'bg-red-500/90 border-red-400 text-white';
      case 'warning':
        return 'bg-yellow-500/90 border-yellow-400 text-white';
      case 'info':
      default:
        return 'bg-blue-500/90 border-blue-400 text-white';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        backdrop-blur-md rounded-lg shadow-2xl border-2 p-4
        flex items-start gap-3
        animate-in slide-in-from-right-full
        transition-all duration-300
      `}
      role="alert"
    >
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium break-words">{toast.message}</p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-white/80 hover:text-white transition-colors ml-2"
        aria-label="Fechar notificação"
      >
        <span className="text-xl leading-none">&times;</span>
      </button>
    </div>
  );
}

