import React from 'react';

// Input, Select, Label — ใช้ร่วมกันในฟอร์มทั้งระบบ รองรับ dark mode

export function Label({ children, htmlFor, className = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-foreground mb-1 ${className}`}
    >
      {children}
    </label>
  );
}

// className ที่ใช้ร่วมกัน Input/Select
const fieldBase =
  'w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`${fieldBase} ${className}`}
      {...props}
    />
  );
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={`${fieldBase} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

// Textarea
export function Textarea({ className = '', rows = 3, ...props }) {
  return (
    <textarea
      rows={rows}
      className={`${fieldBase} resize-y ${className}`}
      {...props}
    />
  );
}
