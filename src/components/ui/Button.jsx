import React from 'react';

// variant: primary | secondary | outline | danger
// size: sm | md | lg
const variantClass = {
  primary:   'bg-primary text-primary-foreground hover:opacity-90',
  secondary: 'bg-secondary text-primary-foreground hover:opacity-90',
  outline:   'border border-primary text-primary bg-transparent hover:bg-muted',
  danger:    'bg-destructive text-destructive-foreground hover:opacity-90',
};

const sizeClass = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...props
}) {
  const base = 'inline-flex items-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantClass[variant]} ${sizeClass[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
