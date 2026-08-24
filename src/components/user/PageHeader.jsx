import React from 'react';

// แถบหัวเรื่องสีฟ้าแบบ Agoda (ธีมเดียวกับ mobile) — วางไว้ใต้ Navbar (fixed) ของแต่ละหน้าฝั่งผู้เช่า
// ให้ทุกหน้าดูเป็นเว็บเดียวกัน
// props:
//   title    = หัวเรื่อง
//   subtitle = คำอธิบายสั้นๆ (ไม่ใส่ก็ได้)
//   maxWidth = คลาสความกว้างของเนื้อหา ให้ตรงกับ content ของหน้านั้น (default max-w-2xl)
export default function PageHeader({ title, subtitle, maxWidth = 'max-w-2xl' }) {
  return (
    <div className="bg-gradient-to-r from-[#0178C7] to-[#0194F3] pt-20 pb-6 px-4">
      <div className={`${maxWidth} mx-auto`}>
        <h1 className="text-white text-xl font-black">{title}</h1>
        {subtitle && <p className="text-white/80 text-sm mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
