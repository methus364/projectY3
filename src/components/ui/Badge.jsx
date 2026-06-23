import React from 'react';

// Badge สถานะ — map สีตามสถานะภาษาไทยที่ใช้ในระบบ
// ถ้า statusText ไม่ตรงใน map จะ fallback เป็น muted

const statusMap = {
  // การจอง
  'รอยืนยัน':     'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'ยืนยันแล้ว':   'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'กำลังเข้าพัก': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'เช็คเอาท์แล้ว':'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  'ยกเลิก':        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',

  // การชำระเงิน / บิล
  'รอชำระ':        'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'รอตรวจสอบ':    'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'ชำระแล้ว':     'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'เกินกำหนด':    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',

  // แจ้งซ่อม
  'รับเรื่องแล้ว': 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  'กำลังซ่อม':    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  'ซ่อมเสร็จ':    'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',

  // สัญญา
  'ใช้งาน':       'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'แจ้งย้ายออก':  'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  'สิ้นสุด':      'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',

  // ห้อง
  'ว่าง':          'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  'ไม่ว่าง':      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  'ปิดปรับปรุง':  'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export default function Badge({ status, className = '' }) {
  const colorClass = statusMap[status] ?? 'bg-muted text-muted-foreground';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass} ${className}`}
    >
      {status}
    </span>
  );
}
