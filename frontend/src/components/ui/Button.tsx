import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-inter rounded-theme-sm px-4 py-2 text-ds-secondary font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary:
      'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-card',
    secondary:
      'border border-border bg-surface text-text-primary hover:bg-background focus:ring-primary',
    danger:
      'bg-error text-white hover:bg-error-hover focus:ring-error shadow-soft',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
