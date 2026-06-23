import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-card fixed top-0 w-full z-50 shadow border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Text logo "Around Loei" */}
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">Around Loei</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition">หน้าแรก</Link>
            <Link to="/roomuser" className="text-foreground hover:text-primary transition">ค้นหาห้องพัก</Link>
            <Link to="/roomhistory" className="text-foreground hover:text-primary transition">ประวัติการจอง</Link>
            <Link to="/mybills" className="text-foreground hover:text-primary transition">บิล/ชำระเงิน</Link>
            <Link to="/profile" className="text-foreground hover:text-primary transition">บัญชีผู้ใช้</Link>
            <ThemeToggle />
          </div>

          {/* Mobile: toggle + theme button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-foreground hover:text-primary focus:outline-none"
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
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-4 py-3 space-y-2">
            <Link to="/" className="block text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>หน้าแรก</Link>
            <Link to="/roomuser" className="block text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>ค้นหาห้องพัก</Link>
            <Link to="/roomhistory" className="block text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>ประวัติการจอง</Link>
            <Link to="/mybills" className="block text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>บิล/ชำระเงิน</Link>
            <Link to="/profile" className="block text-foreground hover:text-primary" onClick={() => setIsOpen(false)}>บัญชีผู้ใช้</Link>
          </div>
        </div>
      )}
    </nav>
  );
}
