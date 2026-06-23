import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-bold">กำลังโหลดประวัติการจอง...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-foreground mb-6">ประวัติการจองห้องพัก</h2>

        {bookings.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">ยังไม่มีข้อมูลการจอง</p>
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
                  className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
                >
                  <div className="flex-1">
                    {/* หัว: ห้อง + badge สถานะ + ประเภท */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <p className="text-lg font-bold text-primary">ห้อง {booking.roomNumber}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
                        {booking.bookingStatus}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/20 text-secondary">
                        {RENT_TYPE_LABEL[booking.rentType] || booking.rentType}
                      </span>
                    </div>

                    {/* รายละเอียด */}
                    <p className="text-sm text-muted-foreground">
                      เข้าพัก: {booking.startDate ? booking.startDate.split('T')[0] : '-'}
                      &nbsp;|&nbsp;
                      ออก: {booking.endDate ? booking.endDate.split('T')[0] : '-'}
                    </p>
                    {booking.roomType && (
                      <p className="text-sm text-muted-foreground">{booking.roomType}</p>
                    )}
                    <p className="text-sm font-semibold text-foreground mt-1">{price}</p>
                  </div>

                  {/* ปุ่มยกเลิก — แสดงเฉพาะสถานะที่ยกเลิกได้ */}
                  {canCancel && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => setCancelTarget(booking)}
                        className="px-4 py-1.5 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/80 transition"
                      >
                        ยกเลิกการจอง
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl shadow"
          >
            ← กลับ
          </button>
        </div>
      </div>

      {/* Modal ยืนยันยกเลิกการจอง */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-foreground mb-2">ยืนยันยกเลิกการจอง</h2>
            <p className="text-sm text-muted-foreground mb-1">
              ห้อง {cancelTarget.roomNumber} (
              {cancelTarget.startDate?.split('T')[0]} – {cancelTarget.endDate?.split('T')[0]})
            </p>
            {/* เตือนชัดๆ ตามกฎธุรกิจ */}
            <p className="text-sm font-semibold text-destructive mb-5">
              ⚠️ การยกเลิกการจองไม่มีการคืนเงิน
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
              >
                ไม่ยกเลิก
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="px-4 py-2 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/80 transition disabled:opacity-50"
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
