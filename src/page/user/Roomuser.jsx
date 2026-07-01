import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';
import BookingStepper from '../../components/user/booking/BookingStepper';
import RoomResultCard from '../../components/user/booking/RoomResultCard';
import RoomDetailModal from '../../components/user/booking/RoomDetailModal';
import BookingSummary from '../../components/user/booking/BookingSummary';
import BookingSuccess from '../../components/user/booking/BookingSuccess';

// ชื่อสเต็ปในแถบ progress (ใช้กับ BookingStepper)
const STEP_LABELS = ['ค้นหา', 'เลือกห้อง', 'ยืนยัน', 'สำเร็จ'];

// นับจำนวนวันระหว่างวันเข้า-ออก (ให้ตรงกับที่ backend คำนวณ)
function countNights(checkIn, checkOut) {
  const diffMs = Math.abs(new Date(checkOut) - new Date(checkIn));
  return Math.ceil(diffMs / 86400000) || 1;
}

export default function Roomuser() {
  const navigate = useNavigate();
  const location = useLocation();

  // สเต็ปปัจจุบันของ wizard (1=ค้นหา, 2=เลือกห้อง, 3=ยืนยัน, 4=สำเร็จ)
  const [step, setStep] = useState(1);

  // ข้อมูลการค้นหา
  const [rentType, setRentType] = useState('');
  const [checkIn, setCheckIn]   = useState('');
  const [checkOut, setCheckOut] = useState('');

  // ผลการค้นหา + ห้องที่เลือก
  const [rooms, setRooms]                   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detailRoom, setDetailRoom]         = useState(null);

  // ข้อมูลผู้เข้าพัก (โหลดจากโปรไฟล์ตอนเข้าสเต็ปยืนยัน)
  const [guest, setGuest] = useState(null);

  // ระหว่างส่งคำขอจอง + ผลลัพธ์ตอนจองสำเร็จ
  const [submitting, setSubmitting]     = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const nights = checkIn && checkOut ? countNights(checkIn, checkOut) : 0;

  // เริ่มจองใหม่ทั้งหมด (ล้างทุก state กลับไปสเต็ป 1)
  const handleReset = () => {
    setStep(1);
    setRentType('');
    setCheckIn('');
    setCheckOut('');
    setRooms([]);
    setSelectedRoomId(null);
    setDetailRoom(null);
    setGuest(null);
    setBookingResult(null);
  };

  // ค้นหาห้องว่างจาก backend (รับค่ามาตรงๆ เผื่อเรียกจาก auto-search ที่ state ยังไม่ทันอัปเดต)
  const runSearch = async (searchRentType, searchCheckIn, searchCheckOut) => {
    try {
      setSearching(true);
      const res = await api.post('/search-rooms', { checkIn: searchCheckIn, checkOut: searchCheckOut });
      // กรองตามประเภทที่เลือก (รายวันต้องมีราคา/วัน, รายเดือนต้องมีราคา/เดือน)
      const filtered = (res.data.data || []).filter((room) => {
        if (searchRentType === 'daily')   return room.price != null;
        if (searchRentType === 'monthly') return room.priceMonthly != null;
        return false;
      });
      setRooms(filtered);
      setSelectedRoomId(null);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.error || 'ค้นหาห้องไม่สำเร็จ');
    } finally {
      setSearching(false);
    }
  };

  // สเต็ป 1: กดค้นหาจากฟอร์มในหน้านี้
  const handleSearch = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return;
    runSearch(rentType, checkIn, checkOut);
  };

  // ถ้าถูกส่งมาจากกล่องค้นหาหน้า Home (มี autoSearch) → เติมค่า + ค้นหาให้อัตโนมัติ
  useEffect(() => {
    const s = location.state;
    if (s && s.autoSearch && s.checkIn && s.checkOut) {
      setRentType(s.rentType);
      setCheckIn(s.checkIn);
      setCheckOut(s.checkOut);
      runSearch(s.rentType, s.checkIn, s.checkOut);
      // ล้าง state ออกจาก history กัน re-search ตอนกด back
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // สเต็ป 2 → 3: โหลดข้อมูลผู้เข้าพักจากโปรไฟล์ แล้วไปหน้ายืนยัน
  const handleGoToSummary = async () => {
    if (!selectedRoomId) {
      alert('กรุณาเลือกห้องก่อน');
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนจองห้อง');
      navigate('/login');
      return;
    }
    try {
      const res = await api.get('/current-user');
      setGuest(res.data.data);
    } catch {
      // โหลดโปรไฟล์ไม่สำเร็จก็ยังจองต่อได้ (แสดง '-' ในหน้าสรุป)
      setGuest(null);
    }
    setStep(3);
  };

  // สเต็ป 3: ยืนยันการจอง → ยิง API แล้วไปหน้าสำเร็จ
  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);
      const res = await api.post('/booking', {
        roomId: selectedRoomId,
        startDate: checkIn,
        endDate: checkOut,
        rentType,
      });
      setBookingResult(res.data);
      setStep(4);
    } catch (err) {
      alert(err.response?.data?.message || 'จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <PageHeader title="จองห้องพัก" subtitle="ค้นหาและจองห้องพักที่ต้องการ" />

      <div className="pt-6 pb-10 px-4 max-w-2xl mx-auto">

        <BookingStepper steps={STEP_LABELS} currentStep={step} />

        {/* ===== สเต็ป 1: เลือกประเภท + วันที่ ===== */}
        {step === 1 && (
          !rentType ? (
            <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
              <p className="text-[#1E293B] font-black text-base mb-5 text-center">เลือกประเภทห้องพัก</p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => setRentType('daily')}
                  className="flex items-center gap-4 bg-[#F3EDF9] border border-[#D9C5EC] p-5 rounded-2xl hover:bg-[#E7D8F3] transition group"
                >
                  <span className="text-3xl">🌅</span>
                  <div className="flex-1 text-left">
                    <p className="text-[#6A3A96] font-black text-base">ห้องพักรายวัน</p>
                    <p className="text-[#8B5CB8] text-xs font-semibold mt-0.5">เหมาะสำหรับพักระยะสั้น 1-30 วัน</p>
                  </div>
                  <span className="text-[#D9C5EC] group-hover:translate-x-1 transition text-xl">›</span>
                </button>
                <button
                  onClick={() => setRentType('monthly')}
                  className="flex items-center gap-4 bg-[#F0FDF4] border border-[#BBF7D0] p-5 rounded-2xl hover:bg-[#DCFCE7] transition group"
                >
                  <span className="text-3xl">🏠</span>
                  <div className="flex-1 text-left">
                    <p className="text-[#15803D] font-black text-base">ห้องพักรายเดือน</p>
                    <p className="text-[#16A34A] text-xs font-semibold mt-0.5">เหมาะสำหรับพักระยะยาว 1 เดือนขึ้นไป</p>
                  </div>
                  <span className="text-[#BBF7D0] group-hover:translate-x-1 transition text-xl">›</span>
                </button>
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-[#94A3B8] text-sm font-semibold hover:text-[#5A2D82]"
                >
                  ← กลับหน้าแรก
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Badge ประเภทที่เลือก + เปลี่ยน */}
              <div className="flex items-center justify-between">
                <span className="bg-[#5A2D82] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                  {rentType === 'daily' ? '🌅 รายวัน' : '🏠 รายเดือน'}
                </span>
                <button
                  type="button"
                  onClick={() => setRentType('')}
                  className="text-sm text-[#64748B] hover:text-[#5A2D82] font-semibold"
                >
                  เปลี่ยนประเภท
                </button>
              </div>

              {/* เลือกวันที่ + ค้นหา */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
                <p className="text-[#1E293B] font-black text-base mb-4">เลือกวันที่</p>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[#334155] text-sm font-bold mb-2">วันที่เข้าพัก</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="w-full border border-[#CBD5E1] rounded-2xl px-3 py-2.5 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82]"
                      />
                    </div>
                    <div>
                      <label className="block text-[#334155] text-sm font-bold mb-2">วันที่ออก</label>
                      <input
                        type="date"
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                        className="w-full border border-[#CBD5E1] rounded-2xl px-3 py-2.5 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82]"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50"
                  >
                    {searching ? 'กำลังค้นหา...' : 'ค้นหาห้องว่าง'}
                  </button>
                </form>
              </div>
            </div>
          )
        )}

        {/* ===== สเต็ป 2: เลือกห้อง ===== */}
        {step === 2 && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#1E293B] font-black text-base">
                {rooms.length > 0 ? `พบ ${rooms.length} ห้องว่าง` : 'ผลการค้นหา'}
              </p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-[#64748B] hover:text-[#5A2D82] font-semibold"
              >
                ← แก้ไขการค้นหา
              </button>
            </div>

            {rooms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">😔</p>
                <p className="text-[#64748B] font-semibold">ไม่มีห้องว่างในช่วงวันที่เลือก</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {rooms.map((room) => (
                  <RoomResultCard
                    key={room.id}
                    room={room}
                    rentType={rentType}
                    selected={selectedRoomId === room.id}
                    onSelect={setSelectedRoomId}
                    onViewDetail={setDetailRoom}
                  />
                ))}
              </div>
            )}

            {rooms.length > 0 && (
              <button
                type="button"
                onClick={handleGoToSummary}
                disabled={!selectedRoomId}
                className="mt-4 w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50"
              >
                ถัดไป{selectedRoom ? ` (ห้อง ${selectedRoom.number})` : ''}
              </button>
            )}
          </div>
        )}

        {/* ===== สเต็ป 3: ยืนยัน ===== */}
        {step === 3 && selectedRoom && (
          <BookingSummary
            room={selectedRoom}
            rentType={rentType}
            checkIn={checkIn}
            checkOut={checkOut}
            nights={nights}
            guest={guest}
            submitting={submitting}
            onConfirm={handleConfirmBooking}
            onBack={() => setStep(2)}
          />
        )}

        {/* ===== สเต็ป 4: สำเร็จ ===== */}
        {step === 4 && bookingResult && (
          <BookingSuccess
            result={bookingResult}
            onGoHistory={() => navigate('/roomhistory')}
            onBookAgain={handleReset}
          />
        )}
      </div>

      {/* Modal รายละเอียดห้อง (ใช้ได้ทุกสเต็ปที่มีรายการห้อง) */}
      <RoomDetailModal
        room={detailRoom}
        rentType={rentType}
        onClose={() => setDetailRoom(null)}
      />
    </div>
  );
}
