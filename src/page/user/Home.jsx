import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getCurrentUser, isLoggedIn as checkIsLoggedIn } from '../../lib/auth';
import Navbar from '../../components/user/Navbar';
import { useLanguage } from '../../contexts/LanguageContext';

// รูป carousel (ชุดเดียวกับ mobile app — วางไว้ใน public/)
const images = [
  '/hero-around-loei.jpg',
  '/hero-slide-1.jpg',
  '/hero-slide-2.jpg',
  '/hero-slide-3.jpg',
  '/hero-slide-4.jpg',
];

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();
const isCancelledStatus = (s) => ['ยกเลิก', 'cancelled', 'canceled'].includes(normalizeStatus(s));
const isPendingStatus = (s) => ['รอชำระมัดจำ', 'รอดำเนินการ'].includes(normalizeStatus(s));

// ข้อความ 2 ภาษา (ยกจาก mobile app)
const TEXT = {
  TH: {
    subtitle: 'หอพักจังหวัดเลย', title: 'Around Loei', login: 'เข้าสู่ระบบ', register: 'สมัครสมาชิก',
    slogan: 'หอพักสบาย ใกล้ มรภ.เลย', price: '฿500-5,xxx', unit: ' วัน/เดือน',
    desc: 'สัมผัสการใช้ชีวิตที่เหนือระดับกับ "Around Loei" หอพักราย-รายเดือน เดินทางสะดวก ใกล้ มรภ.เลย และแหล่งของกินครบครัน',
    bookingList: 'ประวัติการจองห้องพัก', repair: 'แจ้งซ่อมและแจ้งปัญหา', line: 'Line Official',
    fb: 'Facebook Fanpage', call: 'โทรสอบถามห้องว่าง', amenTitle: 'สิ่งอำนวยความสะดวก',
    bookButton: 'จองห้องพัก', bookingActiveButton: 'จองห้องพัก',
    welcome: 'Welcome to Around Loei', bookNow: 'จองเลย',
    modalTitleCheck: 'จองห้องพัก', modalTitleBook: 'เริ่มการจองห้องพัก',
    modalSubtitleCheck: 'เลือกประเภทห้องพักที่คุณต้องการเปิดดูข้อมูลครับ',
    modalSubtitleBook: 'เลือกประเภทห้องพักที่คุณต้องการทำรายการจองครับ',
    dailyChoice: 'ห้องพักรายวัน', monthlyChoice: 'ห้องพักรายเดือน',
    contactTitle: 'ช่องทางการติดต่อ',
  },
  EN: {
    subtitle: 'LEOI RESIDENCE', title: 'Around Loei', login: 'Login', register: 'Register',
    slogan: 'Cozy Living in Loei City', price: '฿500-5,xxx', unit: ' days/month',
    desc: 'Experience superior living at "Around Loei". New, clean, and convenient location near Loei Rajabhat University.',
    bookingList: 'My Bookings', repair: 'Maintenance Request', line: 'Line Official',
    fb: 'Facebook Fanpage', call: 'Call for Inquiry', amenTitle: 'Premium Amenities',
    bookButton: 'Check Available Rooms', bookingActiveButton: 'Book a Room',
    welcome: 'Welcome to Around Loei', bookNow: 'Book Now',
    modalTitleCheck: 'Start Booking Room', modalTitleBook: 'Start Booking Room',
    modalSubtitleCheck: 'Select the room type you would like to view.',
    modalSubtitleBook: 'Select the room type you want to reserve.',
    dailyChoice: 'Daily Room', monthlyChoice: 'Monthly Room',
    contactTitle: 'Contact',
  },
};

export default function Home() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [user, setUser] = useState(null);
  const [confirmedRoom, setConfirmedRoom] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState('check');

  const t = TEXT[lang];

  // โหลด user + ห้องที่ยืนยันแล้ว
  const fetchConfirmedRoom = useCallback(async () => {
    try {
      const res = await api.post('/checkbooking', {});
      const bookings = res.data?.success && Array.isArray(res.data.data) ? res.data.data : [];
      const confirmed = bookings.find(
        (b) => !isCancelledStatus(b.bookingStatus) && !isPendingStatus(b.bookingStatus)
      );
      setConfirmedRoom(confirmed || null);
    } catch {
      setConfirmedRoom(null);
    }
  }, []);

  useEffect(() => {
    const u = getCurrentUser();
    if (u && checkIsLoggedIn()) {
      setUser(u);
      fetchConfirmedRoom();
    }
  }, [fetchConfirmedRoom]);

  // carousel เลื่อนอัตโนมัติทุก 4 วินาที
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((s) => (s + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const roomNumber = confirmedRoom?.roomNumber || user?.roomNo || null;
  const rentType = confirmedRoom?.rentType
    || (user?.role === 'Monthly_Tenant' ? 'monthly' : user?.role === 'Daily_Tenant' ? 'daily' : null);
  const isRoomRevealed = normalizeStatus(confirmedRoom?.bookingStatus) === 'กำลังเข้าพัก';

  const openContact = (type, value) => {
    let url = '';
    if (type === 'tel') url = `tel:${value}`;
    if (type === 'line') url = `https://line.me/ti/p/~${value}`;
    if (type === 'fb') url = `https://facebook.com/${value}`;
    window.open(url, '_blank');
  };

  // จอง: ถ้า user เป็นผู้เช่ารายวัน/รายเดือนอยู่แล้ว พาเข้าหน้าจองตามโรลทันที ไม่ต้องเลือก
  const handleBookNow = (actionType) => {
    if (actionType === 'book' && (user?.role === 'Daily_Tenant' || user?.role === 'Monthly_Tenant')) {
      navigate('/roomuser', { state: { rentType: user.role === 'Daily_Tenant' ? 'daily' : 'monthly' } });
      return;
    }
    setModalAction(actionType);
    setModalOpen(true);
  };

  const handleSelectBookingType = (roomType) => {
    setModalOpen(false);
    navigate('/roomuser', { state: { rentType: roomType } });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0B1526]">
      {/* ===== Navbar ของเว็บ (อันเดียวทั้งไซต์ + ปุ่มสลับภาษา/ธีมอยู่บนนี้) ===== */}
      <Navbar />

      {/* ===== เนื้อหา (เว้น padding-top ให้พ้น navbar fixed h-16) ===== */}
      <div className="pt-16">
        {/* Carousel */}
        <div className="relative w-full h-[320px] md:h-[440px] overflow-hidden">
          {images.map((img, i) => (
            <img
              key={i}
              src={img}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/70" />

          <button
            onClick={() => setCurrentSlide((s) => (s === 0 ? images.length - 1 : s - 1))}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center z-10 hover:bg-black/60"
          >‹</button>
          <button
            onClick={() => setCurrentSlide((s) => (s + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center z-10 hover:bg-black/60"
          >›</button>

          <div className="absolute bottom-14 w-full flex justify-center gap-2 z-10">
            {images.map((_, i) => (
              <span key={i} className={`h-[7px] rounded-full transition-all ${i === currentSlide ? 'w-[18px] bg-white' : 'w-[7px] bg-white/60'}`} />
            ))}
          </div>

          <div className="absolute inset-0 flex flex-col items-center justify-center px-10 pointer-events-none">
            <h1
              className="animate-hero-pulse text-white text-3xl md:text-5xl font-bold text-center mb-2 italic tracking-wide"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: '0 2px 10px rgba(0,0,0,0.55), 0 0 26px rgba(217,178,95,0.45)' }}
            >
              {t.welcome}
            </h1>
            <div className="w-16 h-[3px] rounded bg-[#D9B25F] mb-6 shadow" />
            <button
              onClick={() => handleBookNow(user ? 'book' : 'check')}
              className="pointer-events-auto rounded-full border-2 border-white/85 px-8 py-3 bg-white/15 backdrop-blur text-white font-extrabold text-[15px] tracking-widest hover:bg-white/25 transition"
            >
              {t.bookNow} →
            </button>
          </div>
        </div>

        {/* แผ่นขาวโค้งบน */}
        <div className="-mt-10 bg-white dark:bg-[#12233A] rounded-t-[40px] p-6 md:p-10 relative max-w-5xl mx-auto shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
          {/* ปุ่มจองใหญ่ (เมื่อยังไม่มีห้อง) */}
          {!roomNumber && (
            <button
              onClick={() => handleBookNow(user ? 'book' : 'check')}
              className="w-full bg-gradient-to-br from-[#38B6FF] via-[#0194F3] to-[#0166C8] p-5 rounded-[25px] mb-5 flex items-center gap-4 hover:brightness-105 transition shadow-lg shadow-[#0178C7]/30"
            >
              <span className="bg-white/20 p-2.5 rounded-[15px] text-white text-xl">🚪</span>
              <span className="flex-1 text-left text-white font-black text-lg tracking-wide">{t.bookButton}</span>
              <span className="text-white text-2xl">›</span>
            </button>
          )}

          {/* การ์ดห้องรายวัน */}
          {rentType === 'daily' && roomNumber && (
            <div className="bg-[#F0F9FF] border border-[#BAE6FD] p-5 rounded-[25px] mb-5">
              <div className="flex items-center justify-between">
                <span className="text-[#0369A1] text-xs font-extrabold tracking-wide">ห้องพักรายวันของคุณ</span>
                <span className="flex items-center gap-1 bg-white border border-[#BAE6FD] px-2.5 py-1 rounded-full text-[#0284C7] text-[11px] font-extrabold">✓ ยืนยันแล้ว</span>
              </div>
              <p className="text-[#0284C7] text-xs font-semibold mt-1 mb-4">📅 รายการเข้าพักระยะสั้น (Daily Tenant)</p>
              <div className="flex gap-2.5 mb-4">
                <div className="flex-1 bg-white p-3 rounded-[15px] flex flex-col items-center border border-[#E0F2FE]">
                  <span className="text-[#0284C7] text-xl">📶</span>
                  <span className="text-xs font-bold text-[#334155] mt-1">Wi-Fi หอพัก</span>
                  <span className="text-[11px] text-[#0284C7] font-bold">Pass: ALoei999</span>
                </div>
                <div className="flex-1 bg-white p-3 rounded-[15px] flex flex-col items-center border border-[#E0F2FE]">
                  <span className="text-[#0284C7] text-xl">🔳</span>
                  <span className="text-xs font-bold text-[#334155] mt-1">คีย์การ์ดเข้าตึก</span>
                  <span className="text-[10px] text-[#64748B]">แตะเปิด QR Code</span>
                </div>
              </div>
              <button
                onClick={() => handleBookNow('book')}
                className="w-full bg-[#0284C7] py-3.5 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:brightness-105 transition"
              >
                ＋ {t.bookingActiveButton}
              </button>
            </div>
          )}

          {/* การ์ดห้องรายเดือน */}
          {rentType === 'monthly' && roomNumber && (
            <div className="relative overflow-hidden bg-[#0178C7] p-5 rounded-[25px] mb-5 shadow-lg shadow-[#0178C7]/30">
              <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-white/10" />
              <div className="flex items-center justify-between relative">
                <span className="text-white/85 text-xs font-extrabold tracking-wide">บัญชีลูกบ้านรายเดือน</span>
                <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full text-[#0178C7] text-[11px] font-extrabold">
                  {isRoomRevealed ? '✓ ยืนยันแล้ว' : '🕐 รอยืนยัน'}
                </span>
              </div>
              <p className={`text-white font-black mt-1 relative ${isRoomRevealed ? 'text-3xl' : 'text-xl'}`}>
                {isRoomRevealed ? `ห้อง ${roomNumber}` : 'รอยืนยันที่เคาน์เตอร์'}
              </p>
            </div>
          )}

          {/* ปุ่มประวัติการจอง */}
          {user && (
            <button
              onClick={() => navigate('/roomhistory')}
              className="w-full bg-[#FFF0E6] border border-[#FFDAB9] p-4 rounded-[20px] mb-3 flex items-center gap-4 hover:brightness-105 transition"
            >
              <span className="bg-[#FF5E1F] p-2 rounded-[10px] text-white">📅</span>
              <span className="flex-1 text-left font-bold text-base text-[#FF5E1F]">{t.bookingList}</span>
              <span className="text-[#FF5E1F]">›</span>
            </button>
          )}

          {/* ราคา + สโลแกน */}
          <div className="mb-5 mt-1">
            <div className="w-12 h-[3px] rounded bg-[#D9B25F] mb-3" />
            <p className="text-4xl font-bold text-[#0194F3]">
              {t.price}<span className="text-lg text-[#999] dark:text-slate-400 font-normal">{t.unit}</span>
            </p>
            <p className="text-[22px] font-bold text-[#333] dark:text-white mt-1" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>{t.slogan}</p>
          </div>

          <p className="text-[15px] text-[#666] dark:text-slate-300 leading-relaxed mb-6">{t.desc}</p>

          {/* สิ่งอำนวยความสะดวก */}
          <p className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-4">{t.amenTitle}</p>
          <div className="flex justify-between mb-5">
            {[
              { icon: '📶', label: 'WiFi' },
              { icon: '❄️', label: lang === 'TH' ? 'แอร์' : 'Air' },
              { icon: '📹', label: 'CCTV' },
              { icon: '🚗', label: lang === 'TH' ? 'ที่จอดรถ' : 'Parking' },
            ].map((item, i) => (
              <div key={i} className="w-[23%] flex flex-col items-center bg-[#F0F8FF] dark:bg-[#16324D] py-3 rounded-[15px] border border-[#EAF2FA] dark:border-white/10">
                <span className="text-[#0194F3] text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold text-[#0194F3] dark:text-[#5EB8F5] mt-1">{item.label}</span>
              </div>
            ))}
          </div>

          <div className="h-px bg-[#EEE] dark:bg-white/10 mb-6" />

          {/* ช่องทางติดต่อ */}
          <p className="text-lg font-bold text-[#1A1A1A] dark:text-white mb-4">{t.contactTitle}</p>
          <button onClick={() => openContact('line', 'aroundloei')} className="w-full flex items-center gap-3 bg-[#06C755] p-4 rounded-[18px] mb-3 text-white font-bold hover:brightness-105 transition">
            <span className="w-9 text-center text-xl">💬</span>
            <span className="flex-1 text-left text-base">{t.line}</span>
            <span>›</span>
          </button>
          <button onClick={() => openContact('fb', 'aroundloei')} className="w-full flex items-center gap-3 bg-[#1877F2] p-4 rounded-[18px] mb-3 text-white font-bold hover:brightness-105 transition">
            <span className="w-9 text-center text-xl">📘</span>
            <span className="flex-1 text-left text-base">{t.fb}</span>
            <span>›</span>
          </button>
          <button onClick={() => openContact('tel', '0812345678')} className="w-full flex items-center gap-3 bg-[#FF5E1F] p-4 rounded-[18px] mb-3 text-white font-bold hover:brightness-105 transition">
            <span className="w-9 text-center text-xl">📞</span>
            <span className="flex-1 text-left text-base">{t.call}</span>
            <span>›</span>
          </button>

          <div className="h-12" />
        </div>
      </div>

      {/* ===== Modal เลือกประเภทห้อง ===== */}
      {modalOpen && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
          <div className="relative bg-white rounded-[28px] p-6 w-full max-w-[400px] flex flex-col items-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 bg-[#F1F5F9] rounded-full w-8 h-8 text-[#94A3B8]">✕</button>
            <p className="text-xl font-black text-[#1E293B] mt-2.5">
              {modalAction === 'book' ? t.modalTitleBook : t.modalTitleCheck}
            </p>
            <p className="text-sm text-[#64748B] mt-1.5 mb-6 text-center font-medium px-2.5">
              {modalAction === 'book' ? t.modalSubtitleBook : t.modalSubtitleCheck}
            </p>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={() => handleSelectBookingType('daily')}
                className="w-full py-4 rounded-[18px] flex items-center justify-center gap-2 border bg-[#E0F2FE] border-[#BAE6FD] text-[#0284C7] font-extrabold text-base hover:brightness-105 transition"
              >
                🔎 {t.dailyChoice}
              </button>
              <button
                onClick={() => handleSelectBookingType('monthly')}
                className="w-full py-4 rounded-[18px] flex items-center justify-center gap-2 border bg-[#CCFBF1] border-[#99F6E4] text-[#0D9488] font-extrabold text-base hover:brightness-105 transition"
              >
                🏢 {t.monthlyChoice}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
