import { X } from 'lucide-react';
import type React from 'react';

interface DialogProps {
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  content?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({ onClose, title, description, content, footer }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <button type="button" className="absolute inset-0 bg-black/75" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl min-w-md max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>

        {/* Title */}
        {(title || description) && (
          <div className="px-6 pt-6 mb-10">
            {title && <div className="text-xl">{title}</div>}
            {description && <div className="text-sm text-gray-600">{description}</div>}
          </div>
        )}

        {/* Content */}
        {content && <div className="px-6 flex-1">{content}</div>}

        {/* Footer */}
        {footer && <div className="px-6">{footer}</div>}
      </div>
    </div>
  );
};
