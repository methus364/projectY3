import React, { useState, useEffect } from 'react';
import api from '../../../lib/api';

// นับเวลาที่เหลือจนถึง hold_expires_at เป็นวินาที (0 ถ้าหมดเวลา/ไม่มีค่า)
function secondsLeft(holdExpiresAt) {
  if (!holdExpiresAt) return 0;
  const diff = Math.floor((new Date(holdExpiresAt) - new Date()) / 1000);
  return diff > 0 ? diff : 0;
}

// สเต็ปที่ 4: จองสำเร็จ + ชำระค่าจองด้วย QR PromptPay (เฉพาะรายวัน)
// วิธีจ่าย: สแกน QR โอน → แนบสลิป → รอแอดมินตรวจสอบ (พอยืนยันแล้วการจองจะเปลี่ยนเป็น "ยืนยันการจอง")
// props:
//   result       = ข้อมูลตอนจองสำเร็จ { bookingId, bookingRef, roomNumber, checkInDate, checkOutDate, rentType, totalPrice, emailSent }
//   onGoHistory  = ไปหน้าประวัติการจอง
//   onBookAgain  = จองห้องใหม่อีกครั้ง
export default function BookingSuccess({ result, onGoHistory, onBookAgain }) {
  const isDaily = result.rentType === 'daily';

  const [qr, setQr] = useState(null);          // { invoiceId, qrImage, amount }
  const [slipFile, setSlipFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false); // แจ้งชำระ + แนบสลิปแล้ว

  // ตัวนับถอยหลังเวลาที่เหลือในการชำระ (จาก hold_expires_at)
  const [remaining, setRemaining] = useState(() => secondsLeft(result.holdExpiresAt));

  useEffect(() => {
    // ไม่ต้องนับถ้าไม่ใช่รายวัน หรือแจ้งชำระไปแล้ว
    if (!isDaily || submitted) return;
    const timer = setInterval(() => {
      setRemaining(secondsLeft(result.holdExpiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [isDaily, submitted, result.holdExpiresAt]);

  // แปลงวินาทีเป็น mm:ss
  const mmss = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const expired = isDaily && !submitted && remaining <= 0 && result.holdExpiresAt;

  // ขอ QR PromptPay ของค่าจอง (สร้างบิลค่าห้องให้ด้วย)
  const startPay = async () => {
    // เตือนก่อน 1 ครั้ง — มีเวลา 5 นาที มิฉะนั้นการจองถูกยกเลิกอัตโนมัติ (USER_FLOWS ข้อ 6)
    const ok = window.confirm('คุณมีเวลา 5 นาทีในการชำระเงิน มิฉะนั้นการจองจะถูกยกเลิกอัตโนมัติและห้องจะถูกปล่อยคืน');
    if (!ok) return;
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

  // ส่งแจ้งชำระ + แนบสลิป (ใช้ endpoint /payment เดิม)
  const submitSlip = async () => {
    if (!slipFile) {
      alert('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.append('invoice_id', qr.invoiceId);
      form.append('payment_method', 'โอนเงิน');
      form.append('slip', slipFile);
      // ไม่ตั้ง Content-Type เอง — ให้ browser ใส่ boundary ให้อัตโนมัติ
      const res = await api.post('/payment', form);
      if (res.data.success) setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.message || 'แจ้งชำระไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

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

      {/* ตัวนับถอยหลังเวลาชำระ (รายวัน · ยังไม่แจ้งชำระ) */}
      {isDaily && !submitted && result.holdExpiresAt && (
        expired ? (
          <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-3 mb-4">
            <p className="text-[#B91C1C] font-black text-sm">⏱ หมดเวลาชำระแล้ว</p>
            <p className="text-[#DC2626] text-xs mt-1">การจองอาจถูกยกเลิกอัตโนมัติ — กรุณาตรวจสอบที่ประวัติการจอง</p>
          </div>
        ) : (
          <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-2xl p-3 mb-4">
            <p className="text-[#9A3412] text-xs font-semibold">เหลือเวลาชำระเงิน</p>
            <p className="text-[#C2410C] font-black text-2xl tabular-nums">{mmss}</p>
          </div>
        )
      )}

      {/* ===== ชำระค่าจอง (รายวัน) — QR PromptPay + อัปสลิป ===== */}
      {isDaily ? (
        submitted ? (
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-4 mb-5">
            <p className="text-[#16A34A] font-black">✓ แจ้งชำระเงินแล้ว</p>
            <p className="text-[#15803D] text-xs mt-1">รอแอดมินตรวจสอบสลิป · ยืนยันแล้วการจองจะเปลี่ยนเป็น "ยืนยันการจอง"</p>
          </div>
        ) : qr ? (
          <div className="mb-5">
            <img src={qr.qrImage} alt="QR PromptPay" className="mx-auto w-56 h-56 rounded-2xl border border-[#E2E8F0]" />
            <p className="text-[#1E293B] font-black text-lg mt-2">สแกนโอน ฿{Number(qr.amount).toLocaleString()}</p>
            <p className="text-[#64748B] text-xs mt-1 mb-3">โอนแล้วแนบสลิปด้านล่างเพื่อแจ้งชำระ</p>

            <div className="text-left">
              <label className="block text-[#334155] text-sm font-bold mb-2">แนบสลิปการโอนเงิน <span className="text-red-400">*</span></label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSlipFile(e.target.files[0] || null)}
                className="w-full text-sm border border-[#CBD5E1] rounded-2xl px-3 py-2.5 bg-[#F8FAFC] mb-3"
              />
            </div>
            <button
              onClick={submitSlip}
              disabled={loading}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3 rounded-2xl transition disabled:opacity-50"
            >
              {loading ? 'กำลังส่ง...' : 'ส่งแจ้งชำระ'}
            </button>
          </div>
        ) : (
          <button
            onClick={startPay}
            disabled={loading}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition mb-3 disabled:opacity-50"
          >
            {loading ? 'กำลังสร้าง QR...' : '💳 ชำระค่าจอง (สแกน QR PromptPay)'}
          </button>
        )
      ) : (
        // รายเดือน — จ่ายมัดจำตอนเช็คอิน
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
