import React from 'react';

// Card กลาง — ใช้ซ้ำทั้งระบบ รองรับ dark mode ผ่าน semantic token
export function Card({ children, className = '', ...props }) {
  return (
    <div
      className={`bg-card text-card-foreground rounded-xl border border-border shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-border ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-foreground ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-t border-border ${className}`}>
      {children}
    </div>
  );
}
