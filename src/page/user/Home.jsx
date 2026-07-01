import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../../components/user/Navbar';

// ดึงข้อมูล user จาก localStorage (เหมือนที่ Navbar ใช้)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

// รูปพื้นหลัง hero
const heroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600';

const amenities = [
  { icon: '📶', label: 'WiFi ฟรี' },
  { icon: '❄️', label: 'แอร์' },
  { icon: '📹', label: 'CCTV' },
  { icon: '🚗', label: 'ที่จอดรถ' },
];

export default function Home() {
  const navigate = useNavigate();
  const user = getUser();
  const isLoggedIn = !!localStorage.getItem('token');
  const role = user?.role;

  // ค่าในกล่องค้นหาบน hero
  const [rentType, setRentType] = useState('daily');
  const [checkIn, setCheckIn]   = useState('');
  const [checkOut, setCheckOut] = useState('');

  // กดค้นหา → พาไปหน้าจองพร้อมส่งค่าไปค้นหาอัตโนมัติ
  const handleSearch = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) {
      alert('กรุณาเลือกวันเข้าพักและวันออก');
      return;
    }
    navigate('/roomuser', { state: { rentType, checkIn, checkOut, autoSearch: true } });
  };

  return (
    <>
      <Navbar />

      <div className="bg-[#F8F9FA] min-h-screen">

        {/* ===== Hero + กล่องค้นหา (สไตล์ Agoda) ===== */}
        <div className="relative pt-16">
          <div className="relative h-[380px] md:h-[440px]">
            <img src={heroImage} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#2C1338]/70 to-[#2C1338]/40" />

            {/* หัวข้อกลาง hero */}
            <div className="absolute inset-x-0 top-10 md:top-16 flex flex-col items-center px-6 text-center">
              <h1 className="text-white text-3xl md:text-5xl font-black drop-shadow-lg">
                หาห้องพักที่ใช่ ที่ Around Loei
              </h1>
              <p className="text-white/90 text-sm md:text-lg font-semibold mt-2 drop-shadow">
                หอพักรายวัน–รายเดือน ใกล้ มรภ.เลย จองง่ายในไม่กี่ขั้นตอน
              </p>
            </div>
          </div>

          {/* กล่องค้นหาลอยทับ hero */}
          <div className="max-w-4xl mx-auto px-4 -mt-24 md:-mt-20 relative z-10">
            <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-2xl p-4 md:p-5">
              {/* ปุ่มสลับประเภท รายวัน/รายเดือน */}
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setRentType('daily')}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                    ${rentType === 'daily' ? 'bg-[#5A2D82] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}
                >
                  🌅 รายวัน
                </button>
                <button
                  type="button"
                  onClick={() => setRentType('monthly')}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                    ${rentType === 'monthly' ? 'bg-[#5A2D82] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}
                >
                  🏠 รายเดือน
                </button>
              </div>

              {/* ช่องวันที่ + ปุ่มค้นหา */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                <div className="border border-[#E2E8F0] rounded-xl px-3 py-2">
                  <label className="block text-[#94A3B8] text-xs font-bold mb-0.5">วันเข้าพัก</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full text-sm text-[#1E293B] font-semibold focus:outline-none bg-transparent"
                  />
                </div>
                <div className="border border-[#E2E8F0] rounded-xl px-3 py-2">
                  <label className="block text-[#94A3B8] text-xs font-bold mb-0.5">วันออก</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full text-sm text-[#1E293B] font-semibold focus:outline-none bg-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black px-8 py-3 rounded-xl transition"
                >
                  ค้นหา
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ===== เนื้อหาใต้ hero ===== */}
        <div className="max-w-4xl mx-auto px-4 pt-8 pb-12">

          {/* การ์ด Daily Tenant */}
          {role === 'Daily_Tenant' && (
            <div className="bg-[#F7F2FB] border border-[#D9C5EC] p-5 rounded-2xl mb-6">
              <p className="text-[#6A3A96] font-black text-base">ห้องพักรายวันของคุณ</p>
              <p className="text-[#8B5CB8] text-xs font-semibold mb-4 mt-1">📅 รายการเข้าพักระยะสั้น (Daily Tenant)</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white border border-[#EDE4F5] rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">📶</div>
                  <p className="text-xs font-bold text-slate-600">Wi-Fi หอพัก</p>
                  <p className="text-xs text-[#8B5CB8] font-bold">Pass: ALoei999</p>
                </div>
                <div className="bg-white border border-[#EDE4F5] rounded-2xl p-3 text-center">
                  <div className="text-2xl mb-1">🔑</div>
                  <p className="text-xs font-bold text-slate-600">คีย์การ์ดเข้าตึก</p>
                  <p className="text-xs text-slate-400">แสดง QR Code</p>
                </div>
              </div>
              <Link
                to="/roomuser"
                className="flex items-center justify-center gap-2 bg-[#8B5CB8] text-white py-3 rounded-2xl font-bold hover:bg-[#46236A] transition"
              >
                <span>➕</span> จองห้องพัก
              </Link>
            </div>
          )}

          {/* การ์ด Monthly Tenant */}
          {role === 'Monthly_Tenant' && (
            <div className="mb-6">
              <div className="bg-[#46236A] p-5 rounded-2xl mb-4">
                <p className="text-white/80 text-xs font-bold">บัญชีลูกบ้านรายเดือน</p>
                <p className="text-white text-2xl font-black mt-1">ยินดีต้อนรับ</p>
              </div>
              <p className="text-[#1E293B] font-black text-base mb-3">บริการและฟังก์ชันลูกบ้าน</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link to="/repairrequest" className="flex items-center gap-4 bg-white border border-[#E2E8F0] p-4 rounded-2xl hover:shadow transition group">
                  <span className="bg-[#D32F2F] p-2.5 rounded-xl text-white text-sm">🛠️</span>
                  <span className="flex-1 font-extrabold text-slate-700">แจ้งซ่อมและแจ้งปัญหา</span>
                  <span className="text-slate-300 group-hover:translate-x-1 transition">›</span>
                </Link>
                <Link to="/mybills" className="flex items-center gap-4 bg-white border border-[#E2E8F0] p-4 rounded-2xl hover:shadow transition group">
                  <span className="bg-emerald-500 p-2.5 rounded-xl text-white text-sm">🧾</span>
                  <span className="flex-1 font-extrabold text-slate-700">บิลค่าน้ำ ค่าไฟ ค่าเช่า</span>
                  <span className="text-slate-300 group-hover:translate-x-1 transition">›</span>
                </Link>
              </div>
            </div>
          )}

          {/* แถบราคา + คำโฆษณา (สไตล์ Agoda deal) */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[#1E293B] text-lg font-black">หอพักสบาย ใกล้ มรภ.เลย</p>
              <p className="text-[#64748B] text-sm mt-1">เดินทางสะดวก ใกล้แหล่งของกิน ปลอดภัย มี CCTV</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[#94A3B8] text-xs">เริ่มต้น</p>
              <p className="text-[#D32F2F] text-2xl font-black">฿500</p>
              <p className="text-[#94A3B8] text-xs">ต่อวัน</p>
            </div>
          </div>

          {/* สิ่งอำนวยความสะดวก */}
          <p className="font-black text-[#1E293B] text-base mb-3">สิ่งอำนวยความสะดวก</p>
          <div className="grid grid-cols-4 gap-3 mb-8">
            {amenities.map((a, i) => (
              <div key={i} className="flex flex-col items-center bg-white border border-[#E2E8F0] py-4 rounded-2xl">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[11px] font-bold text-[#5A2D82] mt-1">{a.label}</span>
              </div>
            ))}
          </div>

          {/* ปุ่มประวัติการจอง — เฉพาะผู้ที่ login แล้ว */}
          {isLoggedIn && (
            <Link
              to="/roomhistory"
              className="flex items-center gap-4 bg-white border border-[#E2E8F0] p-4 rounded-2xl mb-8 hover:shadow transition group"
            >
              <span className="bg-[#5A2D82] p-2 rounded-xl text-white">📅</span>
              <span className="flex-1 font-bold text-base text-[#1E293B]">ประวัติการจองห้องของคุณ</span>
              <span className="text-[#94A3B8] group-hover:translate-x-1 transition">›</span>
            </Link>
          )}

          {/* ช่องทางติดต่อ */}
          <p className="font-black text-[#1E293B] text-base mb-4">ช่องทางการติดต่อ</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a
              href="https://line.me/ti/p/~aroundloei"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-3 bg-[#06C755] text-white p-4 rounded-2xl hover:opacity-90 transition"
            >
              <span className="text-2xl">💬</span>
              <span className="font-bold">Line Official</span>
            </a>
            <a
              href="https://facebook.com/aroundloei"
              target="_blank" rel="noreferrer"
              className="flex items-center gap-3 bg-[#1877F2] text-white p-4 rounded-2xl hover:opacity-90 transition"
            >
              <span className="text-2xl">📘</span>
              <span className="font-bold">Facebook</span>
            </a>
            <a
              href="tel:0812345678"
              className="flex items-center gap-3 bg-[#5A2D82] text-white p-4 rounded-2xl hover:opacity-90 transition"
            >
              <span className="text-2xl">📞</span>
              <span className="font-bold">โทรสอบถาม</span>
            </a>
          </div>
        </div>

        {/* footer */}
        <div className="bg-[#2C1338] text-white text-center py-4 text-sm">
          © {new Date().getFullYear()} Around Loei — หอพักจังหวัดเลย
        </div>
      </div>
    </>
  );
}
