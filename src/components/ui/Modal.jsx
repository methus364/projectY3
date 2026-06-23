import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Modal กลาง — กด Esc หรือคลิก overlay เพื่อปิด
// props: isOpen, onClose, title, children, size (sm|md|lg|xl)
const sizeClass = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className = '',
}) {
  // กด Esc เพื่อปิด
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      {/* กล่อง modal — หยุด click event ไม่ให้ปิดตัวเอง */}
      <div
        className={`relative w-full ${sizeClass[size]} rounded-xl bg-card shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        {title && (
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold text-card-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* body */}
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}
