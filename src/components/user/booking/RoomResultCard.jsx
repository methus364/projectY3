import React from 'react';

// การ์ดห้องพัก 1 ห้องในหน้าผลการค้นหา (เลย์เอาต์แนวนอนแบบ Agoda)
// ซ้าย = รูป · กลาง = ชื่อ/ประเภท/สิ่งอำนวยความสะดวก · ขวา = ราคา + ปุ่มเลือก
// props:
//   room       = ข้อมูลห้อง 1 รายการ
//   rentType   = 'daily' | 'monthly'
//   selected   = true ถ้าห้องนี้ถูกเลือกอยู่
//   onSelect   = กดเลือกห้อง
//   onViewDetail = กดดูรายละเอียด (เปิด modal)
export default function RoomResultCard({ room, rentType, selected, onSelect, onViewDetail }) {
  const price = rentType === 'monthly' ? room.priceMonthly : room.price;
  const unitLabel = rentType === 'monthly' ? '/เดือน' : '/วัน';
  const hasDetail = room.description || (room.amenities && room.amenities.length > 0);

  return (
    <div
      onClick={() => onSelect(room.id)}
      className={`flex gap-3 rounded-2xl border-2 overflow-hidden cursor-pointer transition bg-white
        ${selected
          ? 'border-[#5A2D82] shadow-md shadow-[#5A2D82]/20'
          : 'border-[#E2E8F0] hover:border-[#B98FD6]'
        }`}
    >
      {/* รูปห้อง (ซ้าย) */}
      <div className="w-28 sm:w-36 shrink-0 bg-[#F1F5F9]">
        {room.imageUrl ? (
          <img src={room.imageUrl} alt={`ห้อง ${room.number}`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl text-[#CBD5E1]">🏠</div>
        )}
      </div>

      {/* รายละเอียด (กลาง) + ราคา (ขวา) */}
      <div className="flex-1 flex flex-col sm:flex-row justify-between gap-2 py-3 pr-3">
        <div className="min-w-0">
          <p className={`font-black text-base ${selected ? 'text-[#5A2D82]' : 'text-[#1E293B]'}`}>
            ห้อง {room.number}
          </p>
          <p className="text-[#64748B] text-xs mb-1">{room.typeName || 'ทั่วไป'}{room.roomSize ? ` · ${room.roomSize}` : ''}</p>

          {/* ป้ายสิ่งอำนวยความสะดวก (โชว์ไม่เกิน 3 อัน) */}
          {room.amenities && room.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1">
              {room.amenities.slice(0, 3).map((item) => (
                <span key={item} className="bg-[#F3EDF9] text-[#6A3A96] text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  {item}
                </span>
              ))}
            </div>
          )}

          {hasDetail && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onViewDetail(room); }}
              className="text-xs text-[#5A2D82] font-semibold hover:underline"
            >
              ดูรายละเอียด →
            </button>
          )}
        </div>

        {/* ราคา (ขวา) */}
        <div className="text-right shrink-0 flex sm:flex-col items-end justify-between sm:justify-center">
          <div>
            <p className="text-[#D32F2F] font-black text-lg leading-none">
              ฿{Number(price).toLocaleString()}
            </p>
            <p className="text-[#94A3B8] text-xs">{unitLabel}</p>
          </div>
          {room.depositAmount && (
            <p className="text-[#94A3B8] text-[10px] mt-0.5">มัดจำ ฿{Number(room.depositAmount).toLocaleString()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
