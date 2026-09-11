import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeftIcon, UsersIcon, ChevronRightIcon, CheckCircleIcon,
  CalendarDaysIcon, HomeIcon, MinusIcon, PlusIcon, XMarkIcon, TrashIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckSolid } from '@heroicons/react/24/solid';
import api from '../../../lib/api';

// ===== ตัวช่วย (พอร์ตจากแอป app/(daily)/reservation.js) =====

// แยกจำนวนเตียง/ความจุจากชื่อประเภทห้อง — 3 เตียง = 3 คน, อื่นๆ = 2 คน
function bedInfoOf(typeName) {
  const label = String(typeName || '').trim() || 'ห้องมาตรฐาน';
  const m = label.match(/(\d+)/);
  const beds = m ? Number(m[1]) : 1;
  const capacity = beds >= 3 ? 3 : 2;
  return { label, beds, capacity };
}

const AMENITIES = ['ฟรี WiFi', 'เครื่องปรับอากาศ', 'ห้องน้ำส่วนตัว', 'ทีวีดาวเทียม', 'ตู้เย็น', 'ที่จอดรถ'];

const ROOM_IMAGES = [
  'https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=800',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=800',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=800',
  'https://images.unsplash.com/photo-1566665797739-1674de7a421a?q=80&w=800',
];

// จัดกลุ่มห้องตามประเภท → การ์ด: ประเภท, ความจุ, ห้อง, จำนวนว่าง, ราคาต่ำสุด
function groupByType(rooms) {
  const map = new Map();
  for (const r of rooms) {
    const info = bedInfoOf(r.typeName);
    if (!map.has(info.label)) map.set(info.label, { label: info.label, capacity: info.capacity, beds: info.beds, rooms: [] });
    map.get(info.label).rooms.push(r);
  }
  return [...map.values()].map((g) => {
    const availRooms = g.rooms.filter((r) => r.status === 'ว่าง');
    const prices = availRooms.map((r) => Number(r.price || 0)).filter((p) => p > 0);
    return { ...g, availableCount: availRooms.length, minPrice: prices.length ? Math.min(...prices) : 0 };
  });
}

function formatDateTH(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MAX_PER_ROOM = 2;
const MAX_ROOMS_PER_ACCOUNT = 5;

const todayStr = () => new Date().toISOString().split('T')[0];
const tomorrowStr = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };

// ===== หน้าจองรายวัน (โคลนจากแอป) =====
export default function DailyBookingFlow() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDateSelected, setIsDateSelected] = useState(false);
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(tomorrowStr());

  const [roomsData, setRoomsData] = useState([]);
  const [fetching, setFetching] = useState(false);

  const [bedFilter, setBedFilter] = useState(null);
  const [openedType, setOpenedType] = useState(null);
  const [guests, setGuests] = useState(0);
  const [roomsWanted, setRoomsWanted] = useState(0);
  const [countConfirmed, setCountConfirmed] = useState(false);
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmingDeposit, setConfirmingDeposit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  const isLoggedIn = !!localStorage.getItem('token');

  // ถ้าถูกส่งช่วงวันมาจากหน้า Home → เริ่มค้นหาเลย
  useEffect(() => {
    const s = location.state;
    if (s?.checkIn && s?.checkOut) {
      setStartDate(s.checkIn);
      setEndDate(s.checkOut);
      setIsDateSelected(true);
      navigate('.', { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRooms = useCallback(async () => {
    setFetching(true);
    try {
      const res = await api.post('/search-rooms', { checkIn: startDate, checkOut: endDate });
      setRoomsData(res.data?.data || []);
    } catch {
      setRoomsData([]);
    } finally {
      setFetching(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (isDateSelected) fetchRooms();
  }, [isDateSelected, fetchRooms]);

  // รายวัน = ห้องที่มีราคารายวัน (price != null)
  const dailyRooms = roomsData.filter((room) => room.price != null);
  const bedTypes = [...new Set(dailyRooms.map((r) => bedInfoOf(r.typeName).label))];
  const nights = Math.max(1, Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / 86400000));
  const visibleRooms = dailyRooms.filter((r) => !bedFilter || bedInfoOf(r.typeName).label === bedFilter);
  const roomTypes = groupByType(visibleRooms);

  const selectedRooms = dailyRooms.filter((r) => selectedRoomIds.includes(r.id));
  const selectedTotal = selectedRooms.reduce((sum, r) => sum + Number(r.price || 0) * nights, 0);
  const selectedCapacity = selectedRooms.reduce((sum, r) => sum + bedInfoOf(r.typeName).capacity, 0);

  const minGuests = roomsWanted;
  const countError =
    roomsWanted < 1 ? 'กรุณากดเพิ่มจำนวนห้องและจำนวนคนเพื่อจองห้อง'
    : guests < 1 ? 'กรุณาเพิ่มจำนวนผู้เข้าพัก'
    : guests < minGuests ? `ห้องประเภทนี้ต้องมีผู้เข้าพัก ${minGuests} คนขึ้นไป`
    : '';
  const canConfirmCount = countError === '';

  const changeGuests = (delta) => setGuests((g) => Math.min(20, Math.max(0, g + delta)));
  const changeRooms = (delta) => {
    setRoomsWanted((rw) => {
      const next = Math.min(MAX_ROOMS_PER_ACCOUNT, Math.max(0, rw + delta));
      setSelectedRoomIds((ids) => ids.slice(0, next));
      return next;
    });
  };

  const toggleRoom = (roomId) => {
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) return prev.filter((x) => x !== roomId);
      if (prev.length >= roomsWanted) {
        alert(`คุณเลือกจะจอง ${roomsWanted} ห้อง หากต้องการเพิ่ม กรุณาปรับจำนวนห้องด้านบน`);
        return prev;
      }
      return [...prev, roomId];
    });
  };

  const openType = (label) => {
    setOpenedType(label);
    setCountConfirmed(false);
    setGuests(0);
    setRoomsWanted(0);
    setSelectedRoomIds([]);
  };
  const closeType = () => {
    setOpenedType(null);
    setCountConfirmed(false);
    setGuests(0);
    setRoomsWanted(0);
    setSelectedRoomIds([]);
  };

  // ยิงจองหลายห้องในทรานแซกชันเดียว
  const doBooking = async () => {
    if (selectedRoomIds.length === 0) return;
    setConfirmingDeposit(false);
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await api.post('/booking/batch', { roomIds: selectedRoomIds, startDate, endDate });
      setBookingResult(res.data);
      setSelectedRoomIds([]);
    } catch (error) {
      alert(error.response?.data?.message || 'ไม่สามารถจองได้ กรุณาลองใหม่');
      fetchRooms();
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setBookingResult(null);
    setOpenedType(null);
    setCountConfirmed(false);
    setGuests(0);
    setRoomsWanted(0);
    setSelectedRoomIds([]);
    setBedFilter(null);
    fetchRooms();
  };

  // ---------- หน้าเลือกวันที่ ----------
  if (!isDateSelected) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="text-xl font-black text-[#1E293B] text-center mb-6">ระบุวันที่เข้าพักและวันที่ออก</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[11px] font-black text-[#94A3B8]">CHECK-IN DATE</p>
            <input type="date" value={startDate} min={todayStr()}
              onChange={(e) => { setStartDate(e.target.value); if (e.target.value >= endDate) { const n = new Date(e.target.value); n.setDate(n.getDate() + 1); setEndDate(n.toISOString().split('T')[0]); } }}
              className="mt-1 w-full bg-transparent text-lg font-bold text-[#1E293B] focus:outline-none" />
          </div>
          <div className="rounded-2xl border-[1.5px] border-[#E2E8F0] bg-[#F8FAFC] p-4">
            <p className="text-[11px] font-black text-[#94A3B8]">CHECK-OUT DATE</p>
            <input type="date" value={endDate} min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full bg-transparent text-lg font-bold text-[#1E293B] focus:outline-none" />
          </div>
        </div>
        <button onClick={() => setIsDateSelected(true)}
          className="mt-7 w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-4 rounded-2xl transition shadow-lg shadow-[#0194F3]/30">
          ยืนยันวันที่และค้นหาห้องว่าง
        </button>
        <button onClick={() => navigate('/')} className="mt-3 w-full text-[#94A3B8] text-sm font-semibold hover:text-[#0194F3]">
          ← กลับหน้าแรก
        </button>
      </div>
    );
  }

  // ---------- หน้าจองสำเร็จ ----------
  if (bookingResult) {
    const b = bookingResult;
    const refs = (b.bookings || []).map((x) => x.bookingRef).filter(Boolean);
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 text-center">
        <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckSolid className="w-9 h-9 text-[#16A34A]" />
        </div>
        <h2 className="text-[#1E293B] text-xl font-black mb-1">จองห้องสำเร็จ!</h2>
        <p className="text-[#64748B] text-sm mb-3">เลขที่การจองของคุณ</p>
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {refs.map((r) => (
            <span key={r} className="bg-[#E0F2FE] text-[#0284C7] font-black text-sm px-3 py-1.5 rounded-full">{r}</span>
          ))}
        </div>

        <div className="bg-[#F8FAFC] rounded-2xl p-4 text-sm text-left space-y-2 mb-4">
          <div className="flex justify-between"><span className="text-[#94A3B8] font-semibold">วันเข้าพัก</span><span className="text-[#1E293B] font-bold">{formatDateTH(b.checkInDate || startDate)}</span></div>
          <div className="flex justify-between"><span className="text-[#94A3B8] font-semibold">วันออก</span><span className="text-[#1E293B] font-bold">{formatDateTH(b.checkOutDate || endDate)}</span></div>
          <div className="flex justify-between"><span className="text-[#94A3B8] font-semibold">จำนวนห้อง</span><span className="text-[#1E293B] font-bold">{(b.bookings || []).length} ห้อง · {nights} คืน</span></div>
          <div className="flex justify-between"><span className="text-[#94A3B8] font-semibold">ยอดรวมโดยประมาณ</span><span className="text-[#0194F3] font-black">฿{Number(b.totalPrice || 0).toLocaleString()}</span></div>
        </div>

        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-3 mb-5 text-left">
          <p className="text-[#9A3412] text-xs font-bold">⏱ กรุณาชำระเงินภายใน 5 นาที</p>
          <p className="text-[#C2410C] text-[11px] mt-0.5">มิฉะนั้นการจองจะถูกยกเลิกอัตโนมัติและปล่อยห้องคืน — ชำระได้ที่ "บิล/ชำระเงิน"</p>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/mybills')} className="w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3.5 rounded-2xl transition">
            ไปชำระเงิน
          </button>
          <button onClick={() => navigate('/roomhistory')} className="w-full bg-[#F1F5F9] text-[#64748B] font-bold py-3 rounded-2xl hover:bg-[#E2E8F0] transition">
            ดูประวัติการจอง
          </button>
          <button onClick={resetAll} className="w-full text-[#94A3B8] text-sm font-semibold hover:text-[#0194F3]">
            จองห้องอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  // ---------- หน้าเลือกห้อง (list ประเภท / list ห้อง) ----------
  const openedRooms = openedType
    ? dailyRooms.filter((r) => bedInfoOf(r.typeName).label === openedType)
        .sort((a, b) => Number(a.roomNumber || 0) - Number(b.roomNumber || 0))
    : [];
  const availableRooms = openedRooms.filter((r) => r.status === 'ว่าง');
  const displayRooms = availableRooms.slice(0, roomsWanted);

  const Stepper = ({ value, onDec, onInc, decDisabled, incDisabled }) => (
    <div className="flex items-center gap-1">
      <button disabled={decDisabled} onClick={onDec}
        className="w-9 h-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#0194F3] disabled:opacity-40 hover:bg-[#E2E8F0] transition">
        <MinusIcon className="w-4 h-4" />
      </button>
      <span className="w-10 text-center text-lg font-black text-[#1E293B]">{value}</span>
      <button disabled={incDisabled} onClick={onInc}
        className="w-9 h-9 rounded-full bg-[#E0F2FE] flex items-center justify-center text-[#0194F3] disabled:opacity-40 hover:bg-[#BAE6FD] transition">
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="pb-28">
      {/* หัวข้อ + ช่วงวัน */}
      <div className="mb-5">
        <h2 className="text-2xl font-black text-[#1E293B]">ห้องว่างสำหรับวันที่</h2>
        <p className="text-[#0194F3] font-bold mt-1">{formatDateTH(startDate)} - {formatDateTH(endDate)}</p>
      </div>

      {/* ตัวกรองประเภทเตียง (เฉพาะหน้าเลือกประเภท) */}
      {openedType == null && bedTypes.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-4 shadow-sm">
          <p className="text-xs font-black text-[#64748B] mb-2.5">ประเภทเตียง</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setBedFilter(null)}
              className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition ${!bedFilter ? 'bg-[#0194F3] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>ทั้งหมด</button>
            {bedTypes.map((bt) => (
              <button key={bt} onClick={() => setBedFilter(bedFilter === bt ? null : bt)}
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-black transition ${bedFilter === bt ? 'bg-[#0194F3] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>{bt}</button>
            ))}
          </div>
        </div>
      )}

      {fetching ? (
        <div className="text-center py-16 text-[#94A3B8] font-semibold">กำลังโหลดห้องว่าง...</div>
      ) : dailyRooms.length === 0 ? (
        <div className="text-center py-16 text-[#94A3B8]">ไม่พบห้องว่างสำหรับรายวันในช่วงเวลาดังกล่าว</div>
      ) : openedType == null ? (
        // ===== การ์ดต่อประเภท =====
        <div className="space-y-4">
          {roomTypes.map((group, idx) => {
            const img = group.rooms[0]?.imageUrl || ROOM_IMAGES[idx % ROOM_IMAGES.length];
            const soldOut = group.availableCount === 0;
            return (
              <div key={group.label} onClick={() => !soldOut && openType(group.label)}
                className={`bg-white rounded-3xl overflow-hidden border border-[#EEF3F8] shadow-md transition ${soldOut ? 'opacity-60' : 'cursor-pointer hover:shadow-lg'}`}>
                <div className="relative h-44">
                  <img src={img} alt={group.label} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 left-3 text-white text-xs font-black px-3 py-1.5 rounded-2xl ${soldOut ? 'bg-[#EF4444]' : 'bg-[#0194F3]'}`}>
                    {soldOut ? 'เต็มแล้ว' : `เหลือ ${group.availableCount} ห้อง`}
                  </span>
                </div>
                <div className="p-5">
                  <p className="text-lg font-black text-[#1E293B]">{group.label}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[#64748B] text-sm font-bold">
                    <UsersIcon className="w-4 h-4 text-[#0194F3]" /> เข้าพักได้สูงสุด {group.capacity} คน
                    <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                    {group.beds} เตียง
                  </div>
                  <div className="grid grid-cols-2 gap-y-1.5 mt-3">
                    {AMENITIES.map((a) => (
                      <div key={a} className="flex items-center gap-1.5 text-xs text-[#475569] font-semibold">
                        <CheckCircleIcon className="w-4 h-4 text-[#22C55E]" /> {a}
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-[#F1F5F9] my-3.5" />
                  <div className="flex items-end justify-between">
                    <div>
                      {soldOut ? (
                        <p className="text-[#EF4444] font-black">ไม่มีห้องว่าง</p>
                      ) : (
                        <>
                          <p className="text-[11px] text-[#94A3B8] font-bold">เริ่มต้น</p>
                          <p className="text-[#0194F3] font-black text-2xl leading-none">฿{group.minPrice.toLocaleString()}<span className="text-xs text-[#94A3B8] ml-1">/คืน</span></p>
                        </>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-5 py-3 rounded-2xl font-black text-sm ${soldOut ? 'bg-[#F1F5F9] text-[#94A3B8]' : 'bg-[#0194F3] text-white'}`}>
                      ดูห้อง <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {roomTypes.length === 0 && <p className="text-[#94A3B8] py-3">ไม่มีห้องตรงกับตัวกรอง</p>}
        </div>
      ) : (
        // ===== เข้าไปดูห้องของประเภทที่เลือก =====
        <>
          <div className="flex items-center gap-3 mb-4">
            <button onClick={closeType} className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#0194F3] hover:bg-[#E2E8F0]">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <p className="text-lg font-black text-[#1E293B]">{openedType}</p>
              <p className="text-xs text-[#94A3B8] font-bold mt-0.5">ว่าง {availableRooms.length} จาก {openedRooms.length} ห้อง · พักได้ {bedInfoOf(openedType).capacity} คน/ห้อง</p>
            </div>
          </div>

          {/* ตัวเลือกผู้เข้าพัก / จำนวนห้อง */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UsersIcon className="w-5 h-5 text-[#0194F3]" />
                <div><p className="text-sm font-black text-[#1E293B]">ผู้เข้าพัก</p><p className="text-[11px] text-[#94A3B8] font-semibold">รวมทุกห้อง</p></div>
              </div>
              <Stepper value={guests} onDec={() => changeGuests(-1)} onInc={() => changeGuests(1)}
                decDisabled={countConfirmed || guests <= 0} incDisabled={countConfirmed || guests >= 20} />
            </div>
            <div className="h-px bg-[#F1F5F9] my-3.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <HomeIcon className="w-5 h-5 text-[#0194F3]" />
                <div><p className="text-sm font-black text-[#1E293B]">จำนวนห้อง</p><p className="text-[11px] text-[#94A3B8] font-semibold">เลือก {selectedRoomIds.length}/{roomsWanted} ห้อง</p></div>
              </div>
              <Stepper value={roomsWanted} onDec={() => changeRooms(-1)} onInc={() => changeRooms(1)}
                decDisabled={countConfirmed || roomsWanted <= 0} incDisabled={countConfirmed || roomsWanted >= MAX_ROOMS_PER_ACCOUNT} />
            </div>
            <p className={`text-[11px] font-semibold mt-2.5 ${countError ? 'text-[#EF4444]' : roomsWanted >= MAX_ROOMS_PER_ACCOUNT ? 'text-[#F97316]' : 'text-[#94A3B8]'}`}>
              {countError ? countError
                : roomsWanted >= MAX_ROOMS_PER_ACCOUNT ? `จองได้สูงสุด ${MAX_ROOMS_PER_ACCOUNT} ห้องต่อการจอง 1 ครั้ง`
                : `รองรับได้สูงสุด ${roomsWanted * MAX_PER_ROOM} คนใน ${roomsWanted} ห้อง`}
            </p>

            {!countConfirmed ? (
              <button disabled={!canConfirmCount} onClick={() => setCountConfirmed(true)}
                className={`mt-3.5 w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl font-black text-sm text-white transition ${canConfirmCount ? 'bg-[#0194F3] hover:bg-[#0178C7]' : 'bg-[#CBD5E1] cursor-not-allowed'}`}>
                ยืนยันจำนวน แล้วดูห้อง <ChevronRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={() => { setCountConfirmed(false); setSelectedRoomIds([]); }}
                className="mt-3.5 w-full py-3 rounded-2xl bg-[#F1F5F9] text-[#64748B] font-bold text-sm hover:bg-[#E2E8F0]">
                แก้ไขจำนวนคน/ห้อง
              </button>
            )}
          </div>

          {/* ยังไม่ยืนยัน → ข้อความเทา */}
          {!countConfirmed && (
            <div className="text-center py-16 text-[#CBD5E1] font-bold">
              <HomeIcon className="w-12 h-12 mx-auto mb-3 text-[#E2E8F0]" />
              กรุณากดเพิ่มจำนวนห้องและจำนวนคนเพื่อจองห้อง
            </div>
          )}

          {/* ห้องให้เลือก */}
          {countConfirmed && displayRooms.map((room, idx) => {
            const picked = selectedRoomIds.includes(room.id);
            const img = room.imageUrl || ROOM_IMAGES[idx % ROOM_IMAGES.length];
            const info = bedInfoOf(room.typeName);
            return (
              <div key={room.id} className={`bg-white rounded-3xl overflow-hidden shadow-md mb-4 transition ${picked ? 'border-2 border-[#0194F3]' : 'border border-[#EEF3F8]'}`}>
                <div className="relative h-44">
                  <img src={img} alt={info.label} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 bg-[#0194F3] text-white text-xs font-black px-3 py-1.5 rounded-2xl">ว่าง</span>
                  {room.roomNumber != null && (
                    <span className="absolute top-3 right-3 bg-[#0F172A]/65 text-white text-xs font-black px-3 py-1.5 rounded-2xl">ห้อง {room.roomNumber}</span>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-lg font-black text-[#1E293B]">{info.label}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[#64748B] text-sm font-bold">
                    <UsersIcon className="w-4 h-4 text-[#0194F3]" /> เข้าพักได้สูงสุด {info.capacity} คน
                    <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" /> {info.beds} เตียง
                  </div>
                  <div className="h-px bg-[#F1F5F9] my-3.5" />
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[11px] text-[#94A3B8] font-bold">ราคา</p>
                      <p className="text-[#0194F3] font-black text-2xl leading-none">฿{Number(room.price || 0).toLocaleString()}<span className="text-xs text-[#94A3B8] ml-1">/คืน</span></p>
                    </div>
                    <button onClick={() => toggleRoom(room.id)}
                      className={`flex items-center gap-1.5 px-5 py-3 rounded-2xl font-black text-sm text-white transition ${picked ? 'bg-[#10B981]' : 'bg-[#0194F3] hover:bg-[#0178C7]'}`}>
                      {picked ? <><CheckCircleIcon className="w-4 h-4" /> เลือกแล้ว</> : <><PlusIcon className="w-4 h-4" /> เลือกห้องนี้</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {countConfirmed && displayRooms.length === 0 && (
            <div className="text-center bg-white rounded-3xl border border-[#FEE2E2] py-8 px-6">
              <p className="font-black text-[#1E293B]">ห้องประเภทนี้เต็มแล้ว</p>
              <p className="text-sm text-[#94A3B8] mt-1">กรุณาเลือกประเภทอื่น หรือติดต่อเจ้าหน้าที่</p>
              <button onClick={closeType} className="mt-4 bg-[#0194F3] text-white font-black px-6 py-2.5 rounded-2xl">เลือกประเภทอื่น</button>
            </div>
          )}
        </>
      )}

      {/* ปุ่มเปลี่ยนวัน / กลับหน้าแรก */}
      <button onClick={() => { setIsDateSelected(false); closeType(); }}
        className="mt-2 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#F1F5F9] text-[#64748B] font-bold hover:bg-[#E2E8F0]">
        <CalendarDaysIcon className="w-5 h-5" /> เปลี่ยนวันที่เข้าพัก
      </button>
      <button onClick={() => navigate('/')}
        className="mt-3 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#F1F5F9] text-[#0194F3] font-bold border border-[#E2E8F0] hover:bg-[#E2E8F0]">
        <HomeIcon className="w-5 h-5" /> กลับสู่หน้าหลัก
      </button>

      {/* แถบสรุปติดล่าง */}
      {selectedRoomIds.length > 0 && (
        <div className="fixed left-0 right-0 bottom-0 z-40 bg-white border-t border-[#E2E8F0] shadow-[0_-6px_16px_rgba(15,23,42,0.1)] px-5 py-4">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="flex-1">
              <p className="text-xs text-[#64748B] font-bold">เลือก {selectedRoomIds.length} ห้อง · พักได้ {selectedCapacity} คน · {nights} คืน</p>
              <p className="text-2xl font-black text-[#0194F3]">฿{selectedTotal.toLocaleString()}</p>
            </div>
            <button onClick={() => { if (!isLoggedIn) { navigate('/login'); return; } setShowConfirm(true); }}
              className={`flex items-center gap-1.5 px-6 py-3.5 rounded-2xl font-black text-white ${isLoggedIn ? 'bg-[#0194F3]' : 'bg-[#FF7043]'}`}>
              {isLoggedIn ? 'จองเลย' : 'เข้าสู่ระบบ'} <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการจอง */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70" onClick={() => { setShowConfirm(false); setConfirmingDeposit(false); }}>
          <div className="bg-white w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] max-h-[88vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
              <h3 className="text-lg font-black text-[#1E293B]">ยืนยันการจอง {selectedRooms.length} ห้อง</h3>
              <button onClick={() => { setShowConfirm(false); setConfirmingDeposit(false); }} className="bg-[#F1F5F9] rounded-full p-1.5"><XMarkIcon className="w-5 h-5 text-[#64748B]" /></button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div className="bg-[#F8FAFC] rounded-2xl p-4 border border-[#E2E8F0] text-sm space-y-1.5">
                <div className="flex justify-between"><span className="text-[#94A3B8]">วันเข้าพัก</span><span className="font-bold text-[#1E293B]">{formatDateTH(startDate)}</span></div>
                <div className="flex justify-between"><span className="text-[#94A3B8]">วันคืนห้อง</span><span className="font-bold text-[#1E293B]">{formatDateTH(endDate)}</span></div>
                <div className="flex justify-between"><span className="text-[#94A3B8]">ผู้เข้าพัก</span><span className="font-bold text-[#1E293B]">{guests} คน · พักได้รวม {selectedCapacity} คน</span></div>
              </div>

              <p className="text-xs font-black text-[#64748B] mt-4 mb-2">ห้องที่เลือก</p>
              {selectedRooms.map((room) => {
                const info = bedInfoOf(room.typeName);
                return (
                  <div key={room.id} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 border border-[#EEF3F8] mb-2.5">
                    <div className="w-10 h-10 rounded-xl bg-[#E0F2FE] flex items-center justify-center"><HomeIcon className="w-5 h-5 text-[#0194F3]" /></div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-[#1E293B]">{info.label}{room.roomNumber != null ? ` · ห้อง ${room.roomNumber}` : ''}</p>
                      <p className="text-xs text-[#64748B]">พักได้ {info.capacity} คน · ฿{Number(room.price || 0).toLocaleString()}/คืน</p>
                    </div>
                    <button onClick={() => toggleRoom(room.id)} className="p-1.5"><TrashIcon className="w-4 h-4 text-[#F87171]" /></button>
                  </div>
                );
              })}

              <div className="flex justify-between items-center mt-3 pt-3.5 border-t border-[#F1F5F9]">
                <span className="text-sm font-black text-[#1E293B]">ยอดรวมโดยประมาณ ({nights} คืน)</span>
                <span className="text-2xl font-black text-[#0194F3]">฿{selectedTotal.toLocaleString()}</span>
              </div>

              {confirmingDeposit ? (
                <div className="mt-4 p-4 bg-[#FFF7ED] rounded-2xl border border-[#FED7AA]">
                  <p className="text-[#9A3412] font-black text-sm mb-1">⚠️ นโยบายการยกเลิก</p>
                  <p className="text-[#C2410C] text-[13px] mb-3.5">หากยกเลิกการจองภายหลัง จะไม่ได้รับเงินมัดจำคืน — ยืนยันการจองทั้ง {selectedRooms.length} ห้องนี้?</p>
                  <div className="flex gap-2.5">
                    <button disabled={loading} onClick={() => setConfirmingDeposit(false)} className="flex-1 bg-[#F1F5F9] text-[#64748B] font-bold py-3.5 rounded-2xl">ย้อนกลับ</button>
                    <button disabled={loading} onClick={doBooking} className="flex-[2] bg-[#0194F3] text-white font-black py-3.5 rounded-2xl disabled:opacity-60">
                      {loading ? 'กำลังจอง...' : 'ยอมรับ และจองเลย'}
                    </button>
                  </div>
                </div>
              ) : (
                <button disabled={loading || selectedRooms.length === 0} onClick={() => setConfirmingDeposit(true)}
                  className="mt-5 w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                  จองรวม {selectedRooms.length} ห้อง <ChevronRightIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Overlay กำลังจอง */}
      {loading && (
        <div className="fixed inset-0 z-[60] bg-[#0F172A]/55 flex items-center justify-center">
          <div className="bg-white rounded-3xl px-9 py-7 text-center shadow-2xl">
            <div className="w-10 h-10 border-4 border-[#E2E8F0] border-t-[#0194F3] rounded-full animate-spin mx-auto" />
            <p className="mt-4 font-black text-[#1E293B]">กำลังทำรายการจอง…</p>
          </div>
        </div>
      )}
    </div>
  );
}
