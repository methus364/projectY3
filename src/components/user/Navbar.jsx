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

  // ลิงก์เมนูฝั่งขวา (ใช้ซ้ำทั้ง desktop/mobile) — คลาสสีจัดแยกในแต่ละจุด
  const navLinks = (
    <>
      <Link to="/" className="hover:text-white/70 transition">หน้าแรก</Link>
      <Link to="/roomuser" className="hover:text-white/70 transition">ค้นหาห้องพัก</Link>
      {isLoggedIn && (
        <>
          <Link to="/roomhistory" className="hover:text-white/70 transition">ประวัติการจอง</Link>
          <Link to="/mybills" className="hover:text-white/70 transition">บิล/ชำระเงิน</Link>
          {isMonthly && (
            <>
              <Link to="/mycontracts" className="hover:text-white/70 transition">สัญญาเช่า</Link>
              <Link to="/repairrequest" className="hover:text-white/70 transition">แจ้งซ่อม</Link>
            </>
          )}
          <Link to="/profile" className="hover:text-white/70 transition">บัญชีผู้ใช้</Link>
        </>
      )}
    </>
  );

  return (
    <nav className="bg-[#2C1338] fixed top-0 w-full z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">

          {/* โลโก้ Around Loei */}
          <Link to="/" className="flex items-center gap-2 text-xl font-black text-white">
            <span className="text-[#D32F2F] text-2xl">◆</span>
            Around Loei
          </Link>

          {/* เมนู desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-white">
            {navLinks}
            {isLoggedIn ? (
              <button
                onClick={handleSignOut}
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-sm font-bold px-4 py-1.5 rounded-lg transition"
              >
                ออกจากระบบ
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-bold px-4 py-1.5 rounded-lg transition"
              >
                เข้าสู่ระบบ
              </Link>
            )}
            <ThemeToggle />
          </div>

          {/* mobile: toggle + hamburger */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              className="text-white focus:outline-none"
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

      {/* เมนู mobile */}
      {isOpen && (
        <div className="md:hidden bg-[#3B1E52] border-t border-white/10">
          <div className="px-4 py-3 space-y-2 text-white font-semibold" onClick={closeMenu}>
            <Link to="/" className="block hover:text-white/70">หน้าแรก</Link>
            <Link to="/roomuser" className="block hover:text-white/70">ค้นหาห้องพัก</Link>
            {isLoggedIn && (
              <>
                <Link to="/roomhistory" className="block hover:text-white/70">ประวัติการจอง</Link>
                <Link to="/mybills" className="block hover:text-white/70">บิล/ชำระเงิน</Link>
                {isMonthly && (
                  <>
                    <Link to="/mycontracts" className="block hover:text-white/70">สัญญาเช่า</Link>
                    <Link to="/repairrequest" className="block hover:text-white/70">แจ้งซ่อม</Link>
                  </>
                )}
                <Link to="/profile" className="block hover:text-white/70">บัญชีผู้ใช้</Link>
                <button
                  onClick={handleSignOut}
                  className="block text-left text-[#FF8A80] hover:text-[#FFB4A9] text-sm w-full"
                >
                  ออกจากระบบ
                </button>
              </>
            )}
            {!isLoggedIn && (
              <Link to="/login" className="block hover:text-white/70">เข้าสู่ระบบ</Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
