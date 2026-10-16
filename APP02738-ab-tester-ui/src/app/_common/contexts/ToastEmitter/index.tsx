'use client';

import { createContext, type ReactNode, useContext, useState } from 'react';
import Toast from './Toast';
import type { Position, Severity } from './types/types';

type EmitToastArgs = {
  severity?: Severity;
  position?: Position;
  text: ReactNode;
  duration?: number;
  closable?: boolean;
  deletePrevious?: boolean;
};

interface ToastContextType {
  emit: (args: EmitToastArgs) => void;
}

type ToastProviderProps = {
  children: ReactNode;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toastCounter, setToastCounter] = useState(0);
  const [toasts, setToasts] = useState<Required<EmitToastArgs & { id: number }>[]>([]);

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const emit = ({ severity = 'information', position = 'right-top', text, duration = 5000, closable = false, deletePrevious = false }: EmitToastArgs) => {
    const id = toastCounter + 1;
    setToastCounter(id);

    const newToast = {
      closable,
      deletePrevious,
      duration,
      id,
      position,
      severity,
      text,
    };

    setToasts((prev) => (deletePrevious ? [newToast] : [...prev, newToast]));

    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
  };

  const toastsTop = toasts.filter((toastData) => toastData.position === 'top');
  const toastsRightTop = toasts.filter((toastData) => toastData.position === 'right-top');
  const toastsRight = toasts.filter((toastData) => toastData.position === 'right');
  const toastsRightBottom = toasts.filter((toastData) => toastData.position === 'right-bottom');
  const toastsBottom = toasts.filter((toastData) => toastData.position === 'bottom');
  const toastsLeftBottom = toasts.filter((toastData) => toastData.position === 'left-bottom');
  const toastsLeft = toasts.filter((toastData) => toastData.position === 'left');
  const toastsLeftTop = toasts.filter((toastData) => toastData.position === 'left-top');

  return (
    <ToastContext.Provider value={{ emit }}>
      {children}

      {toastsTop.length > 0 && (
        <div className="fixed flex flex-col gap-2.5 z-999 top-2.5 left-1/2 -translate-x-1/2">
          {toastsTop.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsRightTop.length > 0 && (
        <div className="fixed flex flex-col gap-2.5 z-999 top-2.5 right-2.5">
          {toastsRightTop.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsRight.length > 0 && (
        <div className="fixed flex flex-col gap-2.5 z-999 top-1/2 right-2.5 -translate-y-1/2">
          {toastsRight.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsRightBottom.length > 0 && (
        <div className="fixed flex flex-col-reverse gap-2.5 z-999 bottom-2.5 right-2.5">
          {toastsRightBottom.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsBottom.length > 0 && (
        <div className="fixed flex flex-col-reverse gap-2.5 z-999 bottom-2.5 left-1/2 -translate-x-1/2">
          {toastsBottom.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsLeftBottom.length > 0 && (
        <div className="fixed flex flex-col-reverse gap-2.5 z-999 bottom-2.5 left-2.5">
          {toastsLeftBottom.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsLeft.length > 0 && (
        <div className="fixed flex flex-col gap-2.5 z-999 top-1/2 left-2.5 -translate-y-1/2">
          {toastsLeft.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}

      {toastsLeftTop.length > 0 && (
        <div className="fixed flex flex-col gap-2.5 z-999 top-2.5 left-2.5">
          {toastsLeftTop.map((toast) => (
            <Toast key={toast.id} severity={toast.severity} text={toast.text} onClose={toast.closable ? () => removeToast(toast.id) : undefined} />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export { ToastProvider, useToast };
