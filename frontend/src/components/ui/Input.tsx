import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={props.id}
          className="font-inter mb-1 block text-ds-secondary font-medium text-text-secondary"
        >
          {label}
        </label>
      )}
      <input
        className={`font-inter w-full rounded-theme-sm border bg-surface px-3 py-2 text-ds-body text-text-primary shadow-card transition-colors placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:bg-background ${error ? 'border-error' : 'border-border'} ${className}`}
        {...props}
      />
      {error && (
        <p className="font-inter mt-1 text-ds-secondary text-error">{error}</p>
      )}
    </div>
  );
}
