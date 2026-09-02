import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { getUserRole } from '../../lib/auth';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';
import BookingStepper from '../../components/user/booking/BookingStepper';
import RoomDetailModal from '../../components/user/booking/RoomDetailModal';
import BookingSummary from '../../components/user/booking/BookingSummary';
import BookingSuccess from '../../components/user/booking/BookingSuccess';

// ชื่อสเต็ปในแถบ progress (ใช้กับ BookingStepper)
const STEP_LABELS = ['ค้นหา', 'เลือกห้อง', 'ยืนยัน', 'สำเร็จ'];

// ชั้นของห้อง = เลขตัวแรกของเลขห้อง (102 → ชั้น 1) — ใช้จัดกลุ่มผังชั้นรายเดือน
const floorOf = (roomNumber) => String(roomNumber || '').charAt(0) || '?';

// รายชื่อชั้นทั้งหมด เรียงจากน้อยไปมาก (['1','2','3','4'])
function floorsOf(rooms) {
  const set = new Set(rooms.map((r) => floorOf(r.room_number)));
  return [...set].sort();
}

// จัดห้องของชั้นเดียวเป็นผังแปลน 2 คอลัมน์ (เลียนแบบแปลนหอจริง):
// ห้องเลขคี่อยู่คอลัมน์ขวา เลขคู่อยู่คอลัมน์ซ้าย เรียงจากมากไปน้อย (ห้องเลขมากอยู่บน)
// แล้วแทรก "บันได" ไว้กลางคอลัมน์ซ้ายให้ดูเหมือนโถงบันไดของหอ
function buildFloorPlan(floorRooms) {
  const byNumberDesc = (a, b) => Number(b.room_number) - Number(a.room_number);
  const isOdd = (n) => Number(n) % 2 === 1;

  const right = floorRooms.filter((r) => isOdd(r.room_number)).sort(byNumberDesc);
  const left  = floorRooms.filter((r) => !isOdd(r.room_number)).sort(byNumberDesc);

  // แทรกบล็อกบันไดไว้กลางคอลัมน์ซ้าย
  const stairAt = Math.floor(left.length / 2);
  const leftWithStair = [...left];
  leftWithStair.splice(stairAt, 0, { stair: true });

  return { left: leftWithStair, right };
}

// ผังชั้นเดียวแบบ 2 คอลัมน์ + บันไดกลาง — คลิกห้องว่าง (เขียว) เพื่อเลือก, ห้องไม่ว่าง (แดง) กดไม่ได้
function FloorPlan({ floorRooms, onPick }) {
  const { left, right } = buildFloorPlan(floorRooms);

  // การ์ดห้อง 1 ช่องในผัง
  const renderRoom = (room) => (
    <button
      key={room.room_id}
      type="button"
      disabled={!room.available}
      onClick={() => onPick(room)}
      className={`w-28 py-3 rounded-xl font-bold text-sm border-2 text-center transition ${
        room.available
          ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
          : 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
      }`}
    >
      ห้อง {room.room_number}
      <span className="block text-[10px] font-normal">
        {room.available ? `฿${Number(room.price_monthly || 0).toLocaleString()}/ด.` : 'ไม่ว่าง'}
      </span>
    </button>
  );

  // บล็อกบันได (ไม่ใช่ห้อง กดไม่ได้)
  const renderStair = (key) => (
    <div
      key={key}
      className="w-28 py-3 rounded-xl border-2 border-dashed border-[#CBD5E1] text-[#94A3B8] text-xs font-bold text-center flex items-center justify-center"
    >
      🪜 บันได
    </div>
  );

  // วาดทีละช่องในคอลัมน์ (ห้อง หรือ บันได)
  const renderColumn = (cells) =>
    cells.map((cell, i) => (cell.stair ? renderStair(`stair-${i}`) : renderRoom(cell)));

  return (
    <div className="flex justify-center gap-6 md:gap-10 py-2">
      <div className="flex flex-col gap-3">{renderColumn(left)}</div>
      {/* ทางเดินตรงกลาง */}
      <div className="w-px bg-[#E2E8F0] self-stretch" />
      <div className="flex flex-col gap-3">{renderColumn(right)}</div>
    </div>
  );
}

// จัดกลุ่มห้องรายวันตาม "ประเภท" (สไตล์ Agoda) — 1 การ์ด/ประเภท + จำนวนห้องว่าง
// คืน [{ typeName, sample (ห้องตัวอย่างไว้โชว์รูป/ราคา), rooms (ห้องว่างทั้งหมดในประเภทนี้) }]
function groupRoomsByType(rooms) {
  const groups = {};
  for (const room of rooms) {
    const key = room.typeName || 'ทั่วไป';
    if (!groups[key]) groups[key] = { typeName: key, sample: room, rooms: [] };
    groups[key].rooms.push(room);
  }
  return Object.values(groups);
}

// นับจำนวนวันระหว่างวันเข้า-ออก (ให้ตรงกับที่ backend คำนวณ)
function countNights(checkIn, checkOut) {
  const diffMs = Math.abs(new Date(checkOut) - new Date(checkIn));
  return Math.ceil(diffMs / 86400000) || 1;
}

export default function Roomuser() {
  const navigate = useNavigate();
  const location = useLocation();

  // ผู้เช่ารายวัน/รายเดือน จองได้แค่ประเภทตัวเอง (กันข้าม role)
  const userRole = getUserRole();
  const lockedRentType = userRole === 'Daily_Tenant' ? 'daily' : userRole === 'Monthly_Tenant' ? 'monthly' : null;

  // สเต็ปปัจจุบันของ wizard (1=ค้นหา, 2=เลือกห้อง, 3=ยืนยัน, 4=สำเร็จ)
  const [step, setStep] = useState(1);

  // ข้อมูลการค้นหา
  const [rentType, setRentType] = useState(lockedRentType || '');
  const [checkIn, setCheckIn]   = useState('');
  const [checkOut, setCheckOut] = useState('');

  // ผลการค้นหา + ห้องที่เลือก
  const [rooms, setRooms]                   = useState([]);
  const [searching, setSearching]           = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detailRoom, setDetailRoom]         = useState(null);

  // ผังชั้นรายเดือน (ห้องทั้งหมด + ว่าง/ไม่ว่าง ณ วันเข้าพักที่เลือก)
  const [availability, setAvailability]     = useState([]);
  const [selectedFloor, setSelectedFloor]   = useState(''); // ชั้นที่กำลังดูอยู่ในผัง

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
    setAvailability([]);
    setSelectedRoomId(null);
    setDetailRoom(null);
    setGuest(null);
    setBookingResult(null);
  };

  // โหลดผังชั้นรายเดือน ณ วันเข้าพักที่เลือก (เรียกได้ทั้งตอนกดค้นหา และตอนเปลี่ยนวันในผัง)
  const loadAvailability = async (date) => {
    if (!date) return;
    try {
      setSearching(true);
      const res = await api.get(`/rooms/availability?date=${date}`);
      const rows = res.data.data || [];
      setAvailability(rows);
      // ตั้งชั้นเริ่มต้นเป็นชั้นแรกที่มีห้อง
      const floors = floorsOf(rows);
      setSelectedFloor(floors[0] || '');
      setSelectedRoomId(null);
      setStep(2);
    } catch (err) {
      alert(err.response?.data?.message || 'โหลดผังห้องไม่สำเร็จ');
    } finally {
      setSearching(false);
    }
  };

  // เปิด popup รายละเอียดห้องจากผังชั้น (แปลงชื่อฟิลด์จาก availability ให้ตรงกับที่ modal/สรุปใช้)
  const openPlanRoom = (row) => {
    setDetailRoom({
      id: row.room_id,
      number: row.room_number,
      typeName: row.type_name,
      priceMonthly: row.price_monthly,
      price: row.room_price,
      imageUrl: row.image_url,
    });
  };

  // กด "จองห้องนี้" จากผังชั้น → ตั้งห้องที่เลือก + วันออกชั่วคราว (+1 เดือน เพื่อผ่าน overlap; สัญญาจริงกำหนดตอนเข้าพัก) → ไปหน้าสรุป
  const handleBookFromPlan = async () => {
    if (!detailRoom) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนจองห้อง');
      navigate('/login');
      return;
    }
    setRooms([detailRoom]);
    setSelectedRoomId(detailRoom.id);
    const end = new Date(checkIn);
    end.setMonth(end.getMonth() + 1);
    setCheckOut(end.toISOString().split('T')[0]);
    try {
      const res = await api.get('/current-user');
      setGuest(res.data.data);
    } catch {
      setGuest(null);
    }
    setDetailRoom(null);
    setStep(3);
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
  // รายเดือน → เลือกแค่วันเข้าพัก แล้วดูผังชั้น · รายวัน → เลือกช่วงวันแล้วค้นห้องว่าง
  const handleSearch = (e) => {
    e.preventDefault();
    if (rentType === 'monthly') {
      if (!checkIn) return;
      loadAvailability(checkIn);
    } else {
      if (!checkIn || !checkOut) return;
      runSearch(rentType, checkIn, checkOut);
    }
  };

  // ถ้าถูกส่งมาจากกล่องค้นหาหน้า Home (มี autoSearch) → เติมค่า + ค้นหาให้อัตโนมัติ
  useEffect(() => {
    const s = location.state;
    if (!s) return;
    // มาจากหน้า Home แบบเลือกประเภทไว้ล่วงหน้า (ยังไม่ได้ค้นหา) → ตั้งประเภทแล้วไปหน้าเลือกวันที่
    if (s.rentType && !s.autoSearch) {
      if (!lockedRentType || s.rentType === lockedRentType) setRentType(s.rentType);
      navigate('.', { replace: true, state: null });
      return;
    }
    if (!s.autoSearch) return;
    // กันประเภทที่ role ไม่ให้จอง หลุดมาจากหน้า Home (เผื่อ state เก่า/แก้ URL เอง)
    if (lockedRentType && s.rentType !== lockedRentType) return;

    // รายเดือนใช้แค่วันเข้าพัก · รายวันต้องมีทั้งวันเข้าพัก+วันออก
    const hasDates = s.rentType === 'monthly' ? !!s.checkIn : !!(s.checkIn && s.checkOut);
    if (hasDates) {
      setRentType(s.rentType);
      setCheckIn(s.checkIn);
      setCheckOut(s.checkOut);
      // รายเดือนไปที่ผังชั้น (ใช้แค่วันเข้าพัก) · รายวันค้นห้องว่างตามช่วงวัน
      if (s.rentType === 'monthly') {
        loadAvailability(s.checkIn);
      } else {
        runSearch(s.rentType, s.checkIn, s.checkOut);
      }
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
    // เตือนก่อน 1 ครั้ง — ยกเลิกภายหลังไม่ได้เงินมัดจำคืน (USER_FLOWS ข้อ 4.5)
    const accepted = window.confirm('หากยกเลิกการจองภายหลัง จะไม่ได้รับเงินมัดจำคืน\n\nยืนยันการจองห้องพักนี้?');
    if (!accepted) return;
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
              {lockedRentType && (
                <p className="text-[#94A3B8] text-xs font-semibold text-center mb-4">
                  บัญชีของคุณเป็นผู้เช่า{lockedRentType === 'daily' ? 'รายวัน' : 'รายเดือน'} จองได้เฉพาะห้องประเภทนี้
                </p>
              )}
              <div className="flex flex-col gap-4">
                {lockedRentType !== 'monthly' && (
                  <button
                    onClick={() => setRentType('daily')}
                    className="flex items-center gap-4 bg-[#E0F2FE] border border-[#BAE6FD] p-5 rounded-2xl hover:bg-[#D9F3FF] transition group"
                  >
                    <span className="text-3xl">🌅</span>
                    <div className="flex-1 text-left">
                      <p className="text-[#0369A1] font-black text-base">ห้องพักรายวัน</p>
                      <p className="text-[#0284C7] text-xs font-semibold mt-0.5">เหมาะสำหรับพักระยะสั้น 1-30 วัน</p>
                    </div>
                    <span className="text-[#BAE6FD] group-hover:translate-x-1 transition text-xl">›</span>
                  </button>
                )}
                {lockedRentType !== 'daily' && (
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
                )}
              </div>

              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => navigate('/')}
                  className="text-[#94A3B8] text-sm font-semibold hover:text-[#0194F3]"
                >
                  ← กลับหน้าแรก
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Badge ประเภทที่เลือก + เปลี่ยน */}
              <div className="flex items-center justify-between">
                <span className="bg-[#0194F3] text-white text-sm font-bold px-4 py-1.5 rounded-full">
                  {rentType === 'daily' ? '🌅 รายวัน' : '🏠 รายเดือน'}
                </span>
                {!lockedRentType && (
                  <button
                    type="button"
                    onClick={() => setRentType('')}
                    className="text-sm text-[#64748B] hover:text-[#0194F3] font-semibold"
                  >
                    เปลี่ยนประเภท
                  </button>
                )}
              </div>

              {/* เลือกวันที่ + ค้นหา */}
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
                <p className="text-[#1E293B] font-black text-base mb-4">เลือกวันที่</p>
                <form onSubmit={handleSearch} className="space-y-4">
                  {rentType === 'monthly' ? (
                    // รายเดือน: เลือกแค่วันเข้าพัก (สัญญาต่อเนื่อง ไม่กำหนดวันออกตอนจอง)
                    <div>
                      <label className="block text-[#334155] text-sm font-bold mb-2">วันที่เข้าพัก</label>
                      <input
                        type="date"
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="w-full border border-[#CBD5E1] rounded-2xl px-3 py-2.5 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#0194F3]"
                      />
                      <p className="text-[#94A3B8] text-xs mt-2">เลือกวันเข้าพักแล้วดูผังห้องว่าง</p>
                    </div>
                  ) : (
                    // รายวัน: เลือกช่วงวันเข้า-ออก
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#334155] text-sm font-bold mb-2">วันที่เข้าพัก</label>
                        <input
                          type="date"
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          required
                          className="w-full border border-[#CBD5E1] rounded-2xl px-3 py-2.5 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#0194F3]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#334155] text-sm font-bold mb-2">วันที่ออก</label>
                        <input
                          type="date"
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          required
                          className="w-full border border-[#CBD5E1] rounded-2xl px-3 py-2.5 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#0194F3]"
                        />
                      </div>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={searching}
                    className="w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50"
                  >
                    {searching ? 'กำลังโหลด...' : (rentType === 'monthly' ? 'ดูผังห้องว่าง' : 'ค้นหาห้องว่าง')}
                  </button>
                </form>
              </div>
            </div>
          )
        )}

        {/* ===== สเต็ป 2 (รายเดือน): ผังชั้น ===== */}
        {step === 2 && rentType === 'monthly' && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#1E293B] font-black text-base">เลือกห้องจากผัง</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-[#64748B] hover:text-[#0194F3] font-semibold"
              >
                ← เปลี่ยนวันที่
              </button>
            </div>

            {/* เปลี่ยนวันเข้าพักได้ในหน้าผังเลย — ผังรีเฟรชว่าง/ไม่ว่างตามวันใหม่ */}
            <div className="flex items-center gap-2 mb-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-3">
              <label className="text-[#334155] text-sm font-bold">วันเข้าพัก</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => { setCheckIn(e.target.value); loadAvailability(e.target.value); }}
                className="border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0194F3]"
              />
            </div>

            {/* คำอธิบายสี */}
            <div className="flex gap-4 mb-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-300 inline-block" /> ว่าง (กดจองได้)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-50 border border-red-200 inline-block" /> ไม่ว่าง</span>
            </div>

            {availability.length === 0 ? (
              <div className="text-center py-8 text-[#64748B] font-semibold">ไม่มีข้อมูลห้อง</div>
            ) : (
              <>
                {/* ปุ่มเลือกชั้น — ดูทีละชั้น */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {floorsOf(availability).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setSelectedFloor(f)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${
                        selectedFloor === f
                          ? 'bg-[#0194F3] text-white'
                          : 'bg-[#F1F5F9] text-[#64748B] hover:bg-[#E2E8F0]'
                      }`}
                    >
                      ชั้น {f}
                    </button>
                  ))}
                </div>

                {/* ผังชั้นที่เลือก (2 คอลัมน์ + บันไดกลาง) */}
                <FloorPlan
                  floorRooms={availability.filter((r) => floorOf(r.room_number) === selectedFloor)}
                  onPick={openPlanRoom}
                />
              </>
            )}
          </div>
        )}

        {/* ===== สเต็ป 2 (รายวัน): เลือกประเภทห้อง (สไตล์ Agoda) ===== */}
        {step === 2 && rentType !== 'monthly' && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#1E293B] font-black text-base">เลือกประเภทห้อง</p>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-[#64748B] hover:text-[#0194F3] font-semibold"
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
              // จัดกลุ่มตามประเภท แล้วโชว์การ์ดต่อประเภท (รูป + จำนวนห้องว่าง + ราคา/คืน + ปุ่มเลือก)
              <div className="flex flex-col gap-3">
                {groupRoomsByType(rooms).map((group) => {
                  // เลือกประเภทนี้อยู่ไหม (ห้องที่เลือกอยู่ในกลุ่มนี้)
                  const groupSelected = group.rooms.some((r) => r.id === selectedRoomId);
                  const hasDetail = group.sample.description || (group.sample.amenities && group.sample.amenities.length > 0);
                  return (
                    <div
                      key={group.typeName}
                      className={`flex gap-3 rounded-2xl border-2 overflow-hidden bg-white transition
                        ${groupSelected ? 'border-[#0194F3] shadow-md shadow-[#0194F3]/20' : 'border-[#E2E8F0]'}`}
                    >
                      {/* รูป (ซ้าย) */}
                      <div className="w-28 sm:w-36 shrink-0 bg-[#F1F5F9]">
                        {group.sample.imageUrl ? (
                          <img src={group.sample.imageUrl} alt={group.typeName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl text-[#CBD5E1]">🏠</div>
                        )}
                      </div>

                      {/* รายละเอียด (กลาง) + ราคา/ปุ่ม (ขวา) */}
                      <div className="flex-1 flex flex-col sm:flex-row justify-between gap-2 py-3 pr-3">
                        <div className="min-w-0">
                          <p className={`font-black text-base ${groupSelected ? 'text-[#0194F3]' : 'text-[#1E293B]'}`}>
                            {group.typeName}
                          </p>
                          <p className="text-[#16A34A] text-xs font-bold mb-1">ว่าง {group.rooms.length} ห้อง</p>

                          {group.sample.amenities && group.sample.amenities.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {group.sample.amenities.slice(0, 3).map((item) => (
                                <span key={item} className="bg-[#E0F2FE] text-[#0284C7] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                  {item}
                                </span>
                              ))}
                            </div>
                          )}

                          {hasDetail && (
                            <button
                              type="button"
                              onClick={() => setDetailRoom(group.sample)}
                              className="text-xs text-[#0194F3] font-semibold hover:underline"
                            >
                              ดูรายละเอียด →
                            </button>
                          )}
                        </div>

                        {/* ราคา + ปุ่มเลือก (ขวา) */}
                        <div className="text-right shrink-0 flex sm:flex-col items-end justify-between sm:justify-center gap-2">
                          <div>
                            <p className="text-[#0194F3] font-black text-lg leading-none">
                              ฿{Number(group.sample.price).toLocaleString()}
                            </p>
                            <p className="text-[#94A3B8] text-xs">/คืน</p>
                          </div>
                          {/* เลือกประเภท → จองห้องว่างห้องแรกของประเภทนั้นให้ */}
                          <button
                            type="button"
                            onClick={() => setSelectedRoomId(group.rooms[0].id)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm transition
                              ${groupSelected ? 'bg-[#0194F3] text-white' : 'bg-[#E0F2FE] text-[#0194F3] hover:bg-[#BAE6FD]'}`}
                          >
                            {groupSelected ? '✓ เลือกแล้ว' : 'เลือก'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {rooms.length > 0 && (
              <button
                type="button"
                onClick={handleGoToSummary}
                disabled={!selectedRoomId}
                className="mt-4 w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50"
              >
                {/* รายวันจองเป็น "ประเภทห้อง" ไม่โชว์เลขห้อง (แอดมินกำหนดห้องจริงตอนเช็คอิน) */}
                ถัดไป{selectedRoom ? ` (${selectedRoom.typeName || 'ทั่วไป'})` : ''}
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
            onExpire={() => navigate('/')}
          />
        )}
      </div>

      {/* Modal รายละเอียดห้อง (ใช้ได้ทุกสเต็ปที่มีรายการห้อง) */}
      <RoomDetailModal
        room={detailRoom}
        rentType={rentType}
        onClose={() => setDetailRoom(null)}
        onBook={rentType === 'monthly' ? handleBookFromPlan : undefined}
      />
    </div>
  );
}
