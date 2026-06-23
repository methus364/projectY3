import React from 'react';

// PageHeader — หัวข้อหน้า + ปุ่ม action มาตรฐาน
// props: title (string), subtitle (string?), action (ReactNode — ปุ่มหรือ element ขวามือ)
export default function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`mb-6 flex items-start justify-between gap-4 ${className}`}>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
}
