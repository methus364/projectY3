import React from 'react';

// สเต็ปที่ 4: หน้ายืนยันว่าจองสำเร็จ (แทน alert เดิม)
// props:
//   result       = ข้อมูลที่ backend ตอบกลับตอนจองสำเร็จ
//                  { bookingRef, roomNumber, checkInDate, checkOutDate, nights, totalPrice, emailSent }
//   onGoHistory  = ไปหน้าประวัติการจอง
//   onBookAgain  = จองห้องใหม่อีกครั้ง
export default function BookingSuccess({ result, onGoHistory, onBookAgain }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 text-center">
      {/* ไอคอนติ๊กถูก */}
      <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl text-[#16A34A]">✓</span>
      </div>

      <h2 className="text-[#1E293B] text-xl font-black mb-1">จองห้องสำเร็จ!</h2>
      <p className="text-[#64748B] text-sm mb-4">
        เลขที่การจองของคุณคือ
      </p>
      <p className="text-[#0194F3] text-2xl font-black mb-5">{result.bookingRef}</p>

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
          <span className="text-[#0194F3] font-black">฿{Number(result.totalPrice).toLocaleString()}</span>
        </div>
      </div>

      {/* แจ้งเรื่องอีเมล + สถานะถัดไป */}
      <p className="text-[#64748B] text-xs mb-1">
        {result.emailSent
          ? '📧 ส่งอีเมลยืนยันการจองให้แล้ว'
          : 'บันทึกการจองเรียบร้อย (ยังไม่ได้ส่งอีเมล)'}
      </p>
      <p className="text-[#94A3B8] text-xs mb-5">
        สถานะปัจจุบัน: รอชำระมัดจำ · กรุณาติดต่อเจ้าหน้าที่เพื่อยืนยันการเข้าพัก
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onGoHistory}
          className="w-full bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3.5 rounded-2xl transition"
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
