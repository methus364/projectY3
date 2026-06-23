import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ChartPieIcon,
  KeyIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  UsersIcon,
  ReceiptPercentIcon,
  DocumentTextIcon,
  WrenchScrewdriverIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';
import ThemeToggle from '../ui/ThemeToggle';

// สไตล์ลิงก์ sidebar: active = primary, ปกติ = foreground พ่น hover
const navLinkClass = ({ isActive }) =>
  isActive
    ? 'flex items-center gap-3 rounded-lg px-3 py-2 bg-primary text-primary-foreground'
    : 'flex items-center gap-3 rounded-lg px-3 py-2 text-card-foreground hover:bg-muted transition';

const menuItems = [
  { to: '/admin',                  icon: ChartPieIcon,              label: 'แดชบอร์ด',     end: true },
  { to: '/admin/rooms',            icon: KeyIcon,                   label: 'ห้องพัก' },
  { to: '/admin/bookingmanagement',icon: CalendarDaysIcon,          label: 'การจอง' },
  { to: '/admin/booking',          icon: CalendarDaysIcon,          label: 'ปฏิทินจอง' },
  { to: '/admin/products',         icon: ShoppingBagIcon,           label: 'สินค้า/ขายของ' },
  { to: '/admin/customers',        icon: UsersIcon,                 label: 'สมาชิก' },
  { to: '/admin/bill',             icon: ReceiptPercentIcon,        label: 'บิล/ใบแจ้งหนี้' },
  { to: '/admin/money',            icon: BanknotesIcon,             label: 'การชำระเงิน' },
  { to: '/admin/contracts',        icon: DocumentTextIcon,          label: 'สัญญาเช่า' },
  { to: '/admin/repair',           icon: WrenchScrewdriverIcon,     label: 'แจ้งซ่อม' },
  { to: '/admin/audit-logs',       icon: ClipboardDocumentListIcon, label: 'บันทึกกิจกรรม' },
];

const Menubar = () => {
  const navigate = useNavigate();

  // ล้าง session แล้ว redirect ไปหน้า login
  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="flex h-screen w-64 flex-col bg-card border-r border-border p-4">

      {/* หัว sidebar — text logo + ปุ่ม dark mode */}
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xl font-bold text-primary">Around Loei</span>
        <ThemeToggle />
      </div>

      {/* รายการเมนู */}
      <nav className="flex-1 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map(({ to, icon: Icon, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={navLinkClass}>
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ปุ่ม Sign Out ด้านล่าง */}
      <div className="border-t border-border pt-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-destructive hover:bg-muted transition"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </div>
  );
};

export default Menubar;
