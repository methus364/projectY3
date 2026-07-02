import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';

// สเต็ปที่ 4: จองสำเร็จ + ชำระเงินด้วย QR ตอนจองเลย (แบบ Agoda — เฉพาะรายวัน)
// props:
//   result       = ข้อมูลที่ backend ตอบตอนจองสำเร็จ
//                  { bookingId, bookingRef, roomNumber, checkInDate, checkOutDate, rentType, totalPrice, emailSent }
//   onGoHistory  = ไปหน้าประวัติการจอง
//   onBookAgain  = จองห้องใหม่อีกครั้ง
export default function BookingSuccess({ result, onGoHistory, onBookAgain }) {
  const isDaily = result.rentType === 'daily';

  const [qr, setQr] = useState(null);      // { paymentId, qrImage, amount }
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  // สร้าง QR จ่ายค่าจอง (รายวัน)
  const startPay = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/booking/${result.bookingId}/pay-now`);
      if (res.data.success) setQr(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'สร้าง QR ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // poll ถามว่าจ่าย QR สำเร็จหรือยัง ทุก 3 วินาที
  useEffect(() => {
    if (!qr || paid) return;
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/payment/${qr.paymentId}/qr-status`);
        if (res.data.success && res.data.data.paid) {
          setPaid(true);
          clearInterval(timer);
        }
      } catch {
        // poll พลาดชั่วคราว → รอบถัดไปลองใหม่
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [qr, paid]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 text-center">
      {/* ไอคอนติ๊กถูก */}
      <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl text-[#16A34A]">✓</span>
      </div>

      <h2 className="text-[#1E293B] text-xl font-black mb-1">จองห้องสำเร็จ!</h2>
      <p className="text-[#64748B] text-sm mb-4">เลขที่การจองของคุณคือ</p>
      <p className="text-[#5A2D82] text-2xl font-black mb-5">{result.bookingRef}</p>

      {/* สรุปสั้นๆ */}
      <div className="bg-[#F8FAFC] rounded-2xl p-4 text-sm text-left space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-[#94A3B8] font-semibold">ห้องพัก</span>
          <span className="text-[#1E293B] font-bold">ห้อง {result.roomNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8] font-semibold">วันเข้าพัก</span>
          <span className="text-[#1E293B] font-bold">{result.checkInDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8] font-semibold">วันออก</span>
          <span className="text-[#1E293B] font-bold">{result.checkOutDate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#94A3B8] font-semibold">ยอดรวมโดยประมาณ</span>
          <span className="text-[#5A2D82] font-black">฿{Number(result.totalPrice).toLocaleString()}</span>
        </div>
      </div>

      {/* ===== ชำระเงิน (รายวัน = จ่ายตอนจองแบบ Agoda) ===== */}
      {isDaily ? (
        paid ? (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 mb-5">
            <p className="text-[#16A34A] font-black">✓ ชำระเงินแล้ว · การจองยืนยันเรียบร้อย</p>
          </div>
        ) : qr ? (
          <div className="mb-5">
            <img src={qr.qrImage} alt="QR PromptPay" className="mx-auto w-56 h-56 rounded-2xl border border-[#E2E8F0]" />
            <p className="text-[#1E293B] font-black text-lg mt-2">สแกนจ่าย ฿{Number(qr.amount).toLocaleString()}</p>
            <p className="text-[#64748B] text-sm mt-1 flex items-center justify-center gap-2">
              <span className="inline-block w-2 h-2 bg-[#5A2D82] rounded-full animate-pulse" />
              กำลังรอการชำระเงิน... (ยืนยันอัตโนมัติ)
            </p>
          </div>
        ) : (
          <button
            onClick={startPay}
            disabled={loading}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition mb-3 disabled:opacity-50"
          >
            {loading ? 'กำลังสร้าง QR...' : '⚡ ชำระค่าจองตอนนี้ (สแกน QR)'}
          </button>
        )
      ) : (
        // รายเดือน — คงเดิม: จ่ายมัดจำตอนเช็คอิน
        <p className="text-[#94A3B8] text-xs mb-5">
          สถานะปัจจุบัน: รอชำระมัดจำ · กรุณาติดต่อเจ้าหน้าที่เพื่อยืนยันการเข้าพัก
        </p>
      )}

      {/* แจ้งอีเมล */}
      <p className="text-[#64748B] text-xs mb-4">
        {result.emailSent ? '📧 ส่งอีเมลยืนยันการจองให้แล้ว' : 'บันทึกการจองเรียบร้อย'}
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onGoHistory}
          className="w-full bg-[#5A2D82] hover:bg-[#46236A] text-white font-black py-3.5 rounded-2xl transition"
        >
          ดูประวัติการจอง
        </button>
        <button
          onClick={onBookAgain}
          className="w-full bg-[#F1F5F9] text-[#64748B] font-bold py-3 rounded-2xl hover:bg-[#E2E8F0] transition"
        >
          จองห้องอีกครั้ง
        </button>
      </div>
    </div>
  );
}
