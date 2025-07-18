import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleProtectedRoute = (route) => {
    const confirmed = window.confirm('กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้\nต้องการเข้าสู่หน้าล็อกอินหรือไม่?');
    if (confirmed) {
      navigate('/Login');
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-900 fixed top-0 w-full z-50 shadow border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo + Name */}
          <div className="flex items-center space-x-3">
            <img src="https://flowbite.com/docs/images/logo.svg" className="h-8" alt="Logo" />
            <span className="text-xl font-bold text-indigo-700 dark:text-white">ระบบจองห้องพัก</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8">
            <Link to="/Home" className="text-gray-700 dark:text-white hover:text-indigo-600">หน้าแรก</Link>
            <button onClick={() => handleProtectedRoute('/Roomuser')} className="text-gray-700 dark:text-white hover:text-indigo-600">ค้นหาห้องพัก</button>
            <button onClick={() => handleProtectedRoute('/Roomhistory')} className="text-gray-700 dark:text-white hover:text-indigo-600">ประวัติการจอง</button>
            <Link to="/Profile" className="text-gray-700 dark:text-white hover:text-indigo-600">บัญชีผู้ใช้</Link>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none"
              aria-label="toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 space-y-2">
            <Link to="/Home" className="block text-gray-700 dark:text-white hover:text-indigo-600">หน้าแรก</Link>
            <button onClick={() => handleProtectedRoute('/Roomuser')} className="block w-full text-left text-gray-700 dark:text-white hover:text-indigo-600">ค้นหาห้องพัก</button>
            <button onClick={() => handleProtectedRoute('/Roomhistory')} className="block w-full text-left text-gray-700 dark:text-white hover:text-indigo-600">ประวัติการจอง</button>
            <Link to="/Profile" className="block text-gray-700 dark:text-white hover:text-indigo-600">บัญชีผู้ใช้</Link>
          </div>
        </div>
      )}
    </nav>
  );
}