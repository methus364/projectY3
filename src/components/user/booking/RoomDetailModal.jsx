import React from 'react';

// popup แสดงรายละเอียดห้องพัก (รูปใหญ่ + ประเภท + ราคา + มัดจำ + amenities + คำอธิบาย)
// props:
//   room     = ห้องที่จะแสดง (ถ้าเป็น null จะไม่ render อะไร)
//   rentType = 'daily' | 'monthly'
//   onClose  = ปิด popup
export default function RoomDetailModal({ room, rentType, onClose }) {
  if (!room) return null;

  const priceText = rentType === 'monthly'
    ? `฿${Number(room.priceMonthly).toLocaleString()} / เดือน`
    : `฿${Number(room.price).toLocaleString()} / วัน`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#5A2D82] text-xl font-black">ห้อง {room.number}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0]"
          >
            ✕
          </button>
        </div>

        {room.imageUrl && (
          <img
            src={room.imageUrl}
            alt={`ห้อง ${room.number}`}
            className="w-full h-44 object-cover rounded-2xl mb-4"
          />
        )}

        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
            <span className="text-[#94A3B8] font-semibold">ประเภท</span>
            <span className="text-[#1E293B] font-bold">{room.typeName || '-'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
            <span className="text-[#94A3B8] font-semibold">ราคา</span>
            <span className="text-[#5A2D82] font-black">{priceText}</span>
          </div>
          {room.depositAmount && (
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-[#94A3B8] font-semibold">ค่ามัดจำ</span>
              <span className="text-[#1E293B] font-bold">฿{Number(room.depositAmount).toLocaleString()}</span>
            </div>
          )}
          {room.roomSize && (
            <div className="flex justify-between py-2 border-b border-[#F1F5F9]">
              <span className="text-[#94A3B8] font-semibold">ขนาดห้อง</span>
              <span className="text-[#1E293B] font-bold">{room.roomSize}</span>
            </div>
          )}
          {room.amenities && room.amenities.length > 0 && (
            <div className="py-2 border-b border-[#F1F5F9]">
              <p className="text-[#94A3B8] font-semibold mb-1.5">สิ่งอำนวยความสะดวก</p>
              <div className="flex flex-wrap gap-1.5">
                {room.amenities.map((item) => (
                  <span key={item} className="bg-[#F3EDF9] text-[#6A3A96] text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
          {room.description && (
            <p className="text-[#64748B] pt-2">{room.description}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-[#F1F5F9] text-[#64748B] font-bold py-3 rounded-2xl hover:bg-[#E2E8F0] transition"
        >
          ปิด
        </button>
      </div>
    </div>
  );
}
