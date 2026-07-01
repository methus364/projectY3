import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

// แมป booking_status → สีแสดงผล
const STATUS_STYLE = {
  'รอชำระมัดจำ':  'bg-yellow-100 text-yellow-700',
  'ยืนยันการจอง': 'bg-green-100 text-green-700',
  'กำลังเข้าพัก': 'bg-blue-100 text-blue-700',
  'ยกเลิก':       'bg-red-100 text-red-700',
  'ย้ายออกแล้ว':  'bg-gray-100 text-gray-500',
};

const RENT_TYPE_LABEL = {
  daily:   'รายวัน',
  monthly: 'รายเดือน',
};

// สถานะที่ยังยกเลิกได้ (ก่อนเช็คอิน)
const CANCELLABLE_STATUSES = ['รอชำระมัดจำ', 'ยืนยันการจอง'];

export default function Roomhistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // booking ที่กำลังจะยกเลิก (popup ยืนยัน)
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    api.post('/checkbooking', { userId: user.id })
      .then((res) => {
        if (res.data.success) setBookings(res.data.data);
      })
      .catch(() => alert('ดึงข้อมูลการจองไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่'))
      .finally(() => setLoading(false));
  }, [navigate]);

  // ยกเลิกการจอง — PUT /editBooking/:id
  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await api.put(`/editBooking/${cancelTarget.bookingId}`, { status: 'ยกเลิก' });
      // อัปเดต state โดยไม่ต้อง reload
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === cancelTarget.bookingId
            ? { ...b, bookingStatus: 'ยกเลิก' }
            : b
        )
      );
      setCancelTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'ยกเลิกการจองไม่สำเร็จ');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p className="text-[#64748B] font-bold">กำลังโหลดประวัติการจอง...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <PageHeader title="ประวัติการจองห้องพัก" subtitle="รายการจองทั้งหมดของคุณ" />

      <div className="pt-6 pb-10 px-4 max-w-2xl mx-auto">

        {bookings.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-10 text-center">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-[#64748B] font-semibold">ยังไม่มีข้อมูลการจอง</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const statusClass = STATUS_STYLE[booking.bookingStatus] || 'bg-gray-100 text-gray-500';
              const price = booking.rentType === 'monthly'
                ? `฿${Number(booking.priceMonthly || 0).toLocaleString()} / เดือน`
                : `฿${Number(booking.pricePerDay || 0).toLocaleString()} / วัน`;
              const canCancel = CANCELLABLE_STATUSES.includes(booking.bookingStatus);

              return (
                <div
                  key={booking.bookingId}
                  className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5"
                >
                  {/* หัว: ห้อง + badge + ราคา */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[#5A2D82] text-lg font-black">ห้อง {booking.roomNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
                          {booking.bookingStatus}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#F3EDF9] text-[#6A3A96]">
                          {RENT_TYPE_LABEL[booking.rentType] || booking.rentType}
                        </span>
                      </div>
                    </div>
                    <p className="text-[#1E293B] font-black text-base">{price}</p>
                  </div>

                  {/* วันที่ */}
                  <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3 mb-3">
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-[#94A3B8] font-semibold text-xs">เข้าพัก</p>
                        <p className="text-[#1E293B] font-bold">{booking.startDate?.split('T')[0] || '-'}</p>
                      </div>
                      <div className="text-[#CBD5E1] self-center text-lg">→</div>
                      <div className="text-right">
                        <p className="text-[#94A3B8] font-semibold text-xs">ออก</p>
                        <p className="text-[#1E293B] font-bold">{booking.endDate?.split('T')[0] || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* ปุ่มยกเลิก — เฉพาะสถานะที่ยกเลิกได้ */}
                  {canCancel && (
                    <button
                      onClick={() => setCancelTarget(booking)}
                      className="w-full py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold rounded-2xl text-sm hover:bg-red-100 transition"
                    >
                      ยกเลิกการจอง
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl shadow-sm hover:bg-[#F8FAFC] transition"
          >
            ← กลับ
          </button>
        </div>
      </div>

      {/* Modal ยืนยันยกเลิกการจอง */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-[#1E293B] text-lg font-black mb-2">ยืนยันยกเลิกการจอง</h2>
            <p className="text-[#64748B] text-sm mb-3">
              ห้อง {cancelTarget.roomNumber} ({cancelTarget.startDate?.split('T')[0]} – {cancelTarget.endDate?.split('T')[0]})
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
              <p className="text-red-600 text-sm font-bold">⚠️ การยกเลิกการจองไม่มีการคืนเงิน</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition disabled:opacity-50"
              >
                {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
