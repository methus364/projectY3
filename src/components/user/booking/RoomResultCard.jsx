import React from 'react';

// การ์ดห้องพัก 1 ห้องในหน้าผลการค้นหา
// props:
//   room       = ข้อมูลห้อง 1 รายการ
//   rentType   = 'daily' | 'monthly' (ใช้เลือกว่าจะโชว์ราคาแบบไหน)
//   selected   = true ถ้าห้องนี้ถูกเลือกอยู่
//   onSelect   = กดเลือกห้อง
//   onViewDetail = กดดูรายละเอียด (เปิด modal)
export default function RoomResultCard({ room, rentType, selected, onSelect, onViewDetail }) {
  const price = rentType === 'monthly' ? room.priceMonthly : room.price;
  const hasDetail = room.description || (room.amenities && room.amenities.length > 0);

  return (
    <div
      onClick={() => onSelect(room.id)}
      className={`rounded-2xl border-2 overflow-hidden cursor-pointer transition
        ${selected
          ? 'border-[#0194F3] shadow-md shadow-[#0194F3]/20'
          : 'border-[#E2E8F0] hover:border-[#93C5FD]'
        }`}
    >
      {room.imageUrl && (
        <img
          src={room.imageUrl}
          alt={`ห้อง ${room.number}`}
          className="w-full h-28 object-cover"
        />
      )}
      <div className="p-3">
        <div className="flex justify-between items-start mb-1">
          <p className={`font-black text-base ${selected ? 'text-[#0194F3]' : 'text-[#1E293B]'}`}>
            ห้อง {room.number}
          </p>
          <p className="font-black text-[#0194F3] text-sm">
            ฿{Number(price).toLocaleString()}
            <span className="text-[#94A3B8] text-xs font-semibold">
              {rentType === 'monthly' ? ' /เดือน' : ' /วัน'}
            </span>
          </p>
        </div>
        <p className="text-[#64748B] text-xs">{room.typeName || 'ทั่วไป'}</p>
        {room.depositAmount && (
          <p className="text-[#94A3B8] text-xs mt-0.5">มัดจำ ฿{Number(room.depositAmount).toLocaleString()}</p>
        )}
        {hasDetail && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewDetail(room); }}
            className="mt-2 text-xs text-[#0194F3] font-semibold hover:underline"
          >
            ดูรายละเอียด →
          </button>
        )}
      </div>
    </div>
  );
}
