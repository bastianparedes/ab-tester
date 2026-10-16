import { AlertCircle, Check, Image as ImageIcon, Info, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Severity } from '../types/types';
import './styles.css';

type Props = {
  severity: Severity;
  text: ReactNode;
  onClose?: () => void;
};

const Toast = ({ severity, text, onClose }: Props) => {
  const Icon = {
    error: AlertCircle,
    information: Info,
    neutral: ImageIcon,
    success: Check,
    warning: AlertCircle,
  }[severity];

  const severityClasses: Record<Severity, string> = {
    error: 'bg-red-100 border border-red-300 text-red-700 flex items-start gap-1 p-3',
    information: 'bg-blue-100 border border-blue-200 text-blue-800',
    neutral: 'bg-gray-900 border border-gray-800 text-gray-100',
    success: 'bg-green-100 border border-green-200 text-green-800',
    warning: 'bg-yellow-100 border border-yellow-300 text-yellow-800',
  };

  return (
    <div
      className={`w-[320px] max-w-[calc(100svw-64px)] max-h-[calc(100svh-64px)] flex items-center gap-3 relative overflow-hidden rounded-md shadow-lg p-4 animate-toast-in ${severityClasses[severity]}`}
    >
      {onClose && (
        <button
          type="button"
          className="absolute top-2 right-2 h-3 w-3 flex items-center justify-center text-inherit hover:opacity-70"
          data-testid="close-button"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>
      )}
      <Icon className="w-5 h-5 shrink-0" />
      <div className={`font-normal text-[14px] leading-4 pr-4 ${severity === 'error' ? 'text-red-600 leading-5' : ''}`}>{text}</div>
    </div>
  );
};

export default Toast;
