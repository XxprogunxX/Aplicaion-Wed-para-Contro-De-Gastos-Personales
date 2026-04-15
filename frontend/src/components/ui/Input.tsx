import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', id, name, ...props }: InputProps) {
  const inputId = id || name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  const describedBy = [props['aria-describedby'], errorId]
    .filter((value): value is string => Boolean(value && String(value).trim()))
    .join(' ') || undefined;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={`font-inter w-full rounded-theme-sm border bg-surface px-3 py-2 text-ds-body text-text-primary shadow-card transition-colors placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-background ${error ? 'border-error' : 'border-border'} ${className}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="font-inter mt-1 text-ds-secondary text-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}
