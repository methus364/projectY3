import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { getCurrentUser } from '../../lib/auth';
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

const RENT_TYPE_LABEL = { daily: 'รายวัน', monthly: 'รายเดือน' };

// สถานะที่ยังแก้ไข/ยกเลิกได้ (ก่อนเช็คอิน)
const EDITABLE_STATUSES = ['รอชำระมัดจำ', 'ยืนยันการจอง'];

const fmt = (d) => (d ? d.split('T')[0] : '-');

export default function Roomhistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // แก้ไขวันเข้าพัก
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({ startDate: '', endDate: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // บิลของแต่ละ booking (โหลดเมื่อกดดู)
  const [billsMap, setBillsMap] = useState({}); // { [bookingId]: [invoices] }
  const [openBillId, setOpenBillId] = useState(null);

  const loadBookings = () => {
    const user = getCurrentUser() || {};
    api.post('/checkbooking', { userId: user.id })
      .then((res) => { if (res.data.success) setBookings(res.data.data); })
      .catch(() => alert('ดึงข้อมูลการจองไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    loadBookings();
  }, [navigate]);

  // ยกเลิกการจอง
  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      setCancelling(true);
      await api.put(`/editBooking/${cancelTarget.bookingId}`, { status: 'ยกเลิก' });
      setBookings((prev) => prev.map((b) =>
        b.bookingId === cancelTarget.bookingId ? { ...b, bookingStatus: 'ยกเลิก' } : b));
      setCancelTarget(null);
    } catch (err) {
      alert(err.response?.data?.message || 'ยกเลิกการจองไม่สำเร็จ');
    } finally {
      setCancelling(false);
    }
  };

  // เปิด modal แก้ไขวันเข้าพัก
  const openEdit = (booking) => {
    setEditTarget(booking);
    setEditForm({ startDate: fmt(booking.startDate), endDate: fmt(booking.endDate) });
  };

  const handleEdit = async () => {
    try {
      setSavingEdit(true);
      const res = await api.put(`/editBooking/${editTarget.bookingId}`, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      });
      if (res.data.success) {
        setBookings((prev) => prev.map((b) =>
          b.bookingId === editTarget.bookingId
            ? { ...b, startDate: editForm.startDate, endDate: editForm.endDate }
            : b));
        setEditTarget(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'แก้ไขวันเข้าพักไม่สำเร็จ');
    } finally {
      setSavingEdit(false);
    }
  };

  // เปิด/ปิดรายการบิลของ booking (โหลดครั้งแรกที่กด)
  const toggleBills = async (bookingId) => {
    if (openBillId === bookingId) { setOpenBillId(null); return; }
    setOpenBillId(bookingId);
    if (!billsMap[bookingId]) {
      try {
        const res = await api.get(`/booking/${bookingId}/invoices`);
        if (res.data.success) setBillsMap((prev) => ({ ...prev, [bookingId]: res.data.data }));
      } catch (err) {
        alert(err.response?.data?.message || 'โหลดบิลไม่สำเร็จ');
      }
    }
  };

  // เปิด PDF บิล (แนบ token → ดึง blob)
  const openPdf = async (invoiceId) => {
    try {
      const res = await api.get(`/invoice/${invoiceId}/pdf`, { responseType: 'blob' });
      window.open(window.URL.createObjectURL(res.data), '_blank');
    } catch {
      alert('เปิด PDF ไม่สำเร็จ');
    }
  };

  const money = (v) => Number(v || 0).toLocaleString();

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
              const canEdit = EDITABLE_STATUSES.includes(booking.bookingStatus);
              const bills = billsMap[booking.bookingId];

              return (
                <div key={booking.bookingId} className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
                  {/* หัว: ห้อง + badge + ราคา */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-[#5A2D82] text-lg font-black">ห้อง {booking.roomNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>{booking.bookingStatus}</span>
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
                        <p className="text-[#1E293B] font-bold">{fmt(booking.startDate)}</p>
                      </div>
                      <div className="text-[#CBD5E1] self-center text-lg">→</div>
                      <div className="text-right">
                        <p className="text-[#94A3B8] font-semibold text-xs">ออก</p>
                        <p className="text-[#1E293B] font-bold">{fmt(booking.endDate)}</p>
                      </div>
                    </div>
                  </div>

                  {/* ปุ่มดูบิล/ชำระเงิน */}
                  <button
                    onClick={() => toggleBills(booking.bookingId)}
                    className="w-full py-2.5 bg-[#F3EDF9] text-[#5A2D82] font-bold rounded-2xl text-sm hover:bg-[#E9DDF5] transition mb-2"
                  >
                    {openBillId === booking.bookingId ? 'ซ่อนบิล' : 'ดูบิล / ชำระเงิน'}
                  </button>

                  {/* รายการบิล */}
                  {openBillId === booking.bookingId && (
                    <div className="bg-[#F8FAFC] rounded-2xl p-3 mb-2 space-y-2">
                      {!bills ? (
                        <p className="text-[#94A3B8] text-sm text-center py-2">กำลังโหลด...</p>
                      ) : bills.length === 0 ? (
                        <p className="text-[#94A3B8] text-sm text-center py-2">ยังไม่มีบิลสำหรับการจองนี้</p>
                      ) : (
                        bills.map((inv) => {
                          const remaining = Number(inv.total_amount) - Number(inv.paid_amount);
                          return (
                            <div key={inv.invoice_id} className="bg-white rounded-xl px-3 py-2 border border-[#E2E8F0]">
                              <div className="flex justify-between items-center text-sm">
                                <span className="font-bold text-[#1E293B]">฿{money(inv.total_amount)}</span>
                                <span className="text-xs text-[#64748B]">{inv.invoice_status}</span>
                              </div>
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => openPdf(inv.invoice_id)}
                                  className="flex-1 py-1.5 bg-[#F1F5F9] text-[#64748B] font-bold rounded-lg text-xs hover:bg-[#E2E8F0]">
                                  เปิด PDF
                                </button>
                                {remaining > 0 && inv.invoice_status !== 'ยกเลิก' && (
                                  <button onClick={() => navigate('/mybills')}
                                    className="flex-1 py-1.5 bg-[#5A2D82] text-white font-bold rounded-lg text-xs hover:bg-[#46236A]">
                                    ชำระเงิน
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* แก้ไขวันเข้าพัก / ยกเลิก — เฉพาะก่อนเช็คอิน */}
                  {canEdit && (
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(booking)}
                        className="flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-2xl text-sm hover:bg-blue-100 transition">
                        แก้ไขวันเข้าพัก
                      </button>
                      <button onClick={() => setCancelTarget(booking)}
                        className="flex-1 py-2.5 bg-red-50 border border-red-200 text-red-600 font-bold rounded-2xl text-sm hover:bg-red-100 transition">
                        ยกเลิกการจอง
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl shadow-sm hover:bg-[#F8FAFC] transition">
            ← กลับ
          </button>
        </div>
      </div>

      {/* Modal ยืนยันยกเลิก */}
      {cancelTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-[#1E293B] text-lg font-black mb-2">ยืนยันยกเลิกการจอง</h2>
            <p className="text-[#64748B] text-sm mb-3">
              ห้อง {cancelTarget.roomNumber} ({fmt(cancelTarget.startDate)} – {fmt(cancelTarget.endDate)})
            </p>
            <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-5">
              <p className="text-red-600 text-sm font-bold">⚠️ การยกเลิกการจองไม่มีการคืนเงินมัดจำ</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition">
                ไม่ยกเลิก
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600 transition disabled:opacity-50">
                {cancelling ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขวันเข้าพัก */}
      {editTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-[#1E293B] text-lg font-black mb-4">แก้ไขวันเข้าพัก — ห้อง {editTarget.roomNumber}</h2>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-[#334155] text-sm font-bold mb-1">วันเข้าพัก</label>
                <input type="date" value={editForm.startDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-2.5 text-sm bg-[#F8FAFC]" />
              </div>
              <div>
                <label className="block text-[#334155] text-sm font-bold mb-1">วันออก</label>
                <input type="date" value={editForm.endDate}
                  onChange={(e) => setEditForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-2.5 text-sm bg-[#F8FAFC]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditTarget(null)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition">
                ยกเลิก
              </button>
              <button onClick={handleEdit} disabled={savingEdit}
                className="flex-1 py-3 bg-[#5A2D82] text-white font-bold rounded-2xl hover:bg-[#46236A] transition disabled:opacity-50">
                {savingEdit ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
