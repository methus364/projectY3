import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from '../ui/ThemeToggle';

// อ่าน role ของผู้ใช้ที่ login อยู่จาก localStorage
function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role || null;
  } catch {
    return null;
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const role = getUserRole();
  const isLoggedIn = !!localStorage.getItem('token');
  // แจ้งซ่อม + สัญญาเช่า → เฉพาะผู้เช่ารายเดือนเท่านั้น
  const isMonthly = role === 'Monthly_Tenant';

  const closeMenu = () => setIsOpen(false);

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    closeMenu();
    navigate('/login');
  };

  return (
    <nav className="bg-card fixed top-0 w-full z-50 shadow border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* Text logo "Around Loei" */}
          <div className="flex items-center space-x-2">
            <Link to="/" className="text-xl font-bold text-primary">Around Loei</Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition">หน้าแรก</Link>
            <Link to="/roomuser" className="text-foreground hover:text-primary transition">ค้นหาห้องพัก</Link>
            {isLoggedIn && (
              <>
                <Link to="/roomhistory" className="text-foreground hover:text-primary transition">ประวัติการจอง</Link>
                <Link to="/mybills" className="text-foreground hover:text-primary transition">บิล/ชำระเงิน</Link>
                {/* แจ้งซ่อม — แสดงเฉพาะผู้เช่ารายเดือน (Monthly_Tenant มีสัญญาเช่า) */}
                {isMonthly && (
                  <Link to="/repairrequest" className="text-foreground hover:text-primary transition">แจ้งซ่อม</Link>
                )}
                <Link to="/profile" className="text-foreground hover:text-primary transition">บัญชีผู้ใช้</Link>
                <button
                  onClick={handleSignOut}
                  className="text-destructive hover:text-destructive/80 transition text-sm"
                >
                  ออกจากระบบ
                </button>
              </>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="text-foreground hover:text-primary transition">เข้าสู่ระบบ</Link>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile: toggle + hamburger */}
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
            <Link to="/" className="block text-foreground hover:text-primary" onClick={closeMenu}>หน้าแรก</Link>
            <Link to="/roomuser" className="block text-foreground hover:text-primary" onClick={closeMenu}>ค้นหาห้องพัก</Link>
            {isLoggedIn && (
              <>
                <Link to="/roomhistory" className="block text-foreground hover:text-primary" onClick={closeMenu}>ประวัติการจอง</Link>
                <Link to="/mybills" className="block text-foreground hover:text-primary" onClick={closeMenu}>บิล/ชำระเงิน</Link>
                {isMonthly && (
                  <Link to="/repairrequest" className="block text-foreground hover:text-primary" onClick={closeMenu}>แจ้งซ่อม</Link>
                )}
                <Link to="/profile" className="block text-foreground hover:text-primary" onClick={closeMenu}>บัญชีผู้ใช้</Link>
                <button
                  onClick={handleSignOut}
                  className="block text-left text-destructive hover:text-destructive/80 text-sm w-full"
                >
                  ออกจากระบบ
                </button>
              </>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="block text-foreground hover:text-primary" onClick={closeMenu}>เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
