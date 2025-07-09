import React from 'react';
import { NavLink } from 'react-router-dom';

// Import icons จาก Heroicons
import {
  ChartPieIcon,
  ShoppingBagIcon,
  InboxIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/solid';

const Menubar = () => {
  // ฟังก์ชันสำหรับจัดการสไตล์ของ NavLink
  const navLinkStyles = ({ isActive }) =>
    isActive
      ? 'flex items-center p-2 rounded-lg bg-blue-600 text-white' // สไตล์เมื่อ Active
      : 'flex items-center p-2 rounded-lg text-gray-100 hover:bg-gray-700'; // สไตล์ปกติ

  return (
    <div className="flex h-screen w-72 flex-col bg-gray-900 p-4 text-white">
      {/* ส่วนหัวของ Sidebar */}
      <div className="mb-6 flex items-center">
        <svg className="mr-3 h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h12A2.25 2.25 0 0 0 20.25 14.25V3m-16.5 0h16.5m-16.5 0v6.75A2.25 2.25 0 0 0 6 12h12a2.25 2.25 0 0 0 2.25-2.25V3" />
        </svg>
        <span className="text-2xl font-semibold">Admin Panel</span>
      </div>

      {/* รายการเมนู */}
      <nav className="flex-grow">
        <ul className="space-y-2">
          <li>
            <NavLink to="/admin/dashboard" className={navLinkStyles}>
              <ChartPieIcon className="h-6 w-6" />
              <span className="ml-3">Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/orders" className={navLinkStyles}>
              <InboxIcon className="h-6 w-6" />
              <span className="ml-3">Orders</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/products" className={navLinkStyles}>
              <ShoppingBagIcon className="h-6 w-6" />
              <span className="ml-3">Products</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/admin/customers" className={navLinkStyles}>
              <UsersIcon className="h-6 w-6" />
              <span className="ml-3">Customers</span>
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* ส่วนโปรไฟล์ผู้ใช้ด้านล่าง */}
      <div className="mt-auto">
        <div className="p-2">
            <a href="#" className={navLinkStyles({isActive: false})}>
                <Cog6ToothIcon className="h-6 w-6" />
                <span className="ml-3">Settings</span>
            </a>
        </div>
        <div className="border-t border-gray-700 p-2">
            <a href="#" className={navLinkStyles({isActive: false})}>
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                <span className="ml-3">Sign Out</span>
            </a>
        </div>
      </div>
    </div>
  );
};

export default Menubar;