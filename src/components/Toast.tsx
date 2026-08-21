// src/components/Toast.tsx

import { useTranslation } from 'react-i18next';
import type { Toast as ToastType } from '../hooks/useToast';
import './Toast.css';

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  const { t } = useTranslation('common');

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label={t('toast.region')} aria-live="polite">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          onClick={() => onRemove(toast.id)}
          role="alert"
        >
          {toast.icon && <span className="toast__icon">{toast.icon}</span>}
          <span className="toast__message">{toast.message}</span>
          <button
            className="toast__close"
            onClick={e => { e.stopPropagation(); onRemove(toast.id); }}
            aria-label={t('toast.close')}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export default ToastContainer;
