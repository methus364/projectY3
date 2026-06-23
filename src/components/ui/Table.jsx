import React from 'react';

// Table กลาง — header/row/empty state มาตรฐาน รองรับ dark mode
export function Table({ children, className = '' }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className={`min-w-full text-sm ${className}`}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children }) {
  return (
    <thead className="bg-muted text-muted-foreground">
      {children}
    </thead>
  );
}

// th ส่วนหัวคอลัมน์
export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide ${className}`}>
      {children}
    </th>
  );
}

export function TableBody({ children }) {
  return (
    <tbody className="divide-y divide-border bg-card">
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`transition hover:bg-muted/50 ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </tr>
  );
}

// td เซลล์ข้อมูล
export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-card-foreground ${className}`}>
      {children}
    </td>
  );
}

// แสดงเมื่อไม่มีข้อมูล
export function TableEmpty({ colSpan = 1, message = 'ไม่มีข้อมูล' }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
