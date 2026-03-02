import React from 'react';

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export default function Alert({ type, message, onClose }: AlertProps) {
  const baseClasses =
    'font-inter p-4 rounded-theme-sm mb-4 flex justify-between items-center border';
  const typeClasses = {
    error: 'border-error bg-error/10 text-text-primary',
    success: 'border-success bg-success/10 text-text-primary',
    warning: 'border-warning bg-warning/10 text-text-primary',
    info: 'border-primary bg-primary/10 text-text-primary',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[type]}`} role="alert">
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-text-secondary hover:text-text-primary focus:outline-none"
          aria-label="Cerrar alerta"
        >
          ×
        </button>
      )}
    </div>
  );
}