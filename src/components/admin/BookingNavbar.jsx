import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const BookingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <nav className="bg-white dark:bg-gray-900 top-0 w-full mb-5 z-50 shadow border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="hidden md:flex space-x-8">
              <NavLink to="/admin/booking" className="text-gray-700 dark:text-white hover:text-indigo-600">ปฏิทินการจองห้องพัก</NavLink>
              <NavLink to="/admin/bookingmanagement" className="text-gray-700 dark:text-white hover:text-indigo-600">จัดการการจองห้องพัก</NavLink>

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
               <NavLink to="/admin/booking" className="text-gray-700 dark:text-white hover:text-indigo-600">ปฏิทินการจองห้องพัก</NavLink>
              <NavLink to="/admin/bookingmanagement" className="text-gray-700 dark:text-white hover:text-indigo-600">จัดการการจองห้องพัก</NavLink>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}

export default BookingNavbar
