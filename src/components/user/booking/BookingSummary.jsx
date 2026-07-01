import React from 'react';

// สเต็ปที่ 3: สรุปการจอง + ข้อมูลผู้เข้าพัก + นโยบายยกเลิก + ปุ่มยืนยัน
// props:
//   room       = ห้องที่เลือก
//   rentType   = 'daily' | 'monthly'
//   checkIn/checkOut = วันที่ (string YYYY-MM-DD)
//   nights     = จำนวนวัน (คำนวณจากหน้าแม่)
//   guest      = ข้อมูลผู้เข้าพัก { full_name, phone_number, email }
//   submitting = true ระหว่างส่งคำขอจอง
//   onConfirm  = กดยืนยันการจอง
//   onBack     = ย้อนกลับไปเลือกห้อง
export default function BookingSummary({ room, rentType, checkIn, checkOut, nights, guest, submitting, onConfirm, onBack }) {
  const unitPrice = rentType === 'monthly' ? room.priceMonthly : room.price;
  const unitLabel = rentType === 'monthly' ? 'เดือน' : 'วัน';

  // คิดยอดรวมแบบเดียวกับ backend เพื่อโชว์ให้ผู้ใช้ดู (ยอดจริงยึดจาก server ตอนจองสำเร็จ)
  const units = rentType === 'monthly' ? Math.max(Math.ceil(nights / 30), 1) : nights;
  const estimatedTotal = units * Number(unitPrice || 0);

  return (
    <div className="space-y-4">
      {/* กล่องสรุปห้อง + วันที่ */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
        <p className="text-[#1E293B] font-black text-base mb-4">สรุปการจอง</p>

        {room.imageUrl && (
          <img
            src={room.imageUrl}
            alt={`ห้อง ${room.number}`}
            className="w-full h-32 object-cover rounded-2xl mb-4"
          />
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">ห้องพัก</span>
            <span className="text-[#1E293B] font-bold">ห้อง {room.number} ({room.typeName || 'ทั่วไป'})</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">ประเภทการเช่า</span>
            <span className="text-[#1E293B] font-bold">{rentType === 'monthly' ? 'รายเดือน' : 'รายวัน'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">วันเข้าพัก</span>
            <span className="text-[#1E293B] font-bold">{checkIn}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">วันออก</span>
            <span className="text-[#1E293B] font-bold">{checkOut}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">รวมทั้งหมด</span>
            <span className="text-[#1E293B] font-bold">{nights} วัน</span>
          </div>
        </div>
      </div>

      {/* กล่องข้อมูลผู้เข้าพัก (ดึงจากโปรไฟล์อัตโนมัติ) */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
        <p className="text-[#1E293B] font-black text-base mb-3">ข้อมูลผู้เข้าพัก</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">ชื่อ-นามสกุล</span>
            <span className="text-[#1E293B] font-bold">{guest?.full_name || '-'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">เบอร์โทร</span>
            <span className="text-[#1E293B] font-bold">{guest?.phone_number || '-'}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[#94A3B8] font-semibold">อีเมล</span>
            <span className="text-[#1E293B] font-bold">{guest?.email || '-'}</span>
          </div>
        </div>
      </div>

      {/* กล่องแจกแจงราคา */}
      <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
        <p className="text-[#1E293B] font-black text-base mb-3">รายละเอียดราคา</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5">
            <span className="text-[#64748B]">
              ฿{Number(unitPrice).toLocaleString()} × {units} {unitLabel}
            </span>
            <span className="text-[#1E293B] font-bold">฿{estimatedTotal.toLocaleString()}</span>
          </div>
          {room.depositAmount && (
            <div className="flex justify-between py-1.5">
              <span className="text-[#64748B]">ค่ามัดจำ (ชำระตอนเข้าพัก)</span>
              <span className="text-[#1E293B] font-bold">฿{Number(room.depositAmount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-2.5 border-t border-[#E2E8F0] mt-1">
            <span className="text-[#1E293B] font-black">ยอดรวมโดยประมาณ</span>
            <span className="text-[#0194F3] font-black text-lg">฿{estimatedTotal.toLocaleString()}</span>
          </div>
          <p className="text-[#94A3B8] text-xs">* ยอดจริงคำนวณและยืนยันโดยระบบเมื่อจองสำเร็จ</p>
        </div>
      </div>

      {/* นโยบายยกเลิก */}
      <div className="bg-[#EFF6FF] border border-[#BAE6FD] rounded-2xl p-4">
        <p className="text-[#0369A1] font-bold text-sm mb-1">🛡️ นโยบายการยกเลิก</p>
        <p className="text-[#0284C7] text-xs">
          ยกเลิกการจองได้ฟรีก่อนวันเช็คอิน · หลังเช็คอินแล้วไม่สามารถยกเลิกได้
        </p>
      </div>

      {/* ปุ่มย้อนกลับ + ยืนยัน */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="flex-1 bg-[#F1F5F9] text-[#64748B] font-bold py-3.5 rounded-2xl hover:bg-[#E2E8F0] transition disabled:opacity-50"
        >
          ← ย้อนกลับ
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className="flex-[2] bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50"
        >
          {submitting ? 'กำลังส่งคำขอ...' : 'ยืนยันการจอง'}
        </button>
      </div>
    </div>
  );
}
