import React from 'react';
import { useNavigate } from 'react-router-dom';

// หน้า "เกี่ยวกับเรา" — อ้างอิง mobile app: app/(tabs)/about.js (ธีมฟ้า)
export default function About() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0194F3]">
      {/* Header ฟ้า + ปุ่มกลับ */}
      <div className="bg-[#0178C7] px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white font-bold text-sm w-28">
          ← กลับหน้าหลัก
        </button>
        <h1 className="text-white text-lg font-black">เกี่ยวกับเรา</h1>
        <div className="w-20" />
      </div>

      <div className="bg-[#F8F9FA] pb-10">
        {/* Hero */}
        <div className="bg-white p-6 rounded-b-[35px] shadow-sm flex flex-col md:flex-row items-center gap-6">
          <img
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=1000"
            alt="Around Loei"
            className="w-full md:w-[45%] h-56 md:h-72 object-cover rounded-3xl"
          />
          <div className="w-full md:w-1/2">
            <p className="text-[#0194F3] text-2xl font-black mb-1">Around Loei</p>
            <p className="text-[#555] font-bold italic mb-4">"ดูแลคุณด้วยใจ เหมือนเป็นครอบครัวเดียวกัน"</p>
            <p className="text-[#666] text-sm leading-relaxed">
              Around Loei เริ่มต้นขึ้นจากความตั้งใจที่จะพัฒนาแพลตฟอร์มและยกระดับมาตรฐานการอยู่อาศัยในจังหวัดเลย
              เรามุ่งเน้นการให้บริการหอพักที่สะอาด ปลอดภัย มีสิ่งอำนวยความสะดวกครบครัน และเดินทางสะดวกสบาย
              ใกล้ชิดแหล่งชุมชนและสถานศึกษา เพื่อตอบโจทย์ไลฟ์สไตล์ของนักศึกษาและคนทำงานในยุคปัจจุบันอย่างแท้จริง
            </p>
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="px-5 mt-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E3F2FD] flex items-center justify-center mb-4 text-2xl">👁️</div>
            <p className="text-[#1A1A1A] font-bold mb-2">วิสัยทัศน์ (Vision)</p>
            <p className="text-[#666] text-sm leading-relaxed">
              เป็นผู้นำด้านแพลตฟอร์มและการจัดการที่พักอาศัยที่ทันสมัยที่สุดในจังหวัดเลย
              โดยนำเทคโนโลยีเข้ามาช่วยอำนวยความสะดวก เพื่อให้การใช้ชีวิตของผู้พักอาศัยเป็นเรื่องง่ายและมีความสุข
            </p>
          </div>
          <div className="flex-1 bg-white p-5 rounded-3xl shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F5E9] flex items-center justify-center mb-4 text-2xl">🚀</div>
            <p className="text-[#1A1A1A] font-bold mb-2">พันธกิจ (Mission)</p>
            <p className="text-[#666] text-sm leading-relaxed">
              มุ่งมั่นรักษามาตรฐานความสะอาดและความปลอดภัยระดับสูงสุด พร้อมทั้งพัฒนาบุคลากรและการบริการ
              แจ้งซ่อมรวดเร็ว ใส่ใจในทุกข้อเสนอแนะ เพื่อสร้างความพึงพอใจสูงสุดให้แก่สมาชิก Around Loei ทุกคน
            </p>
          </div>
        </div>

        {/* Why choose us */}
        <div className="bg-white mx-5 mt-6 p-5 rounded-[25px] shadow-sm">
          <p className="text-[#1A1A1A] text-lg font-bold mb-5">ทำไมต้องเลือก Around Loei?</p>
          {[
            { t: 'ทำเลเด่น ใกล้ มรภ.เลย', d: 'เดินทางสะดวกสบาย ประหยัดเวลาและค่าเดินทาง รายล้อมไปด้วยร้านค้าและร้านอาหาร' },
            { t: 'ระบบรักษาความปลอดภัย 24 ชม.', d: 'อุ่นใจด้วยระบบกล้อง CCTV ทั่วทุกมุมตึก พร้อมระบบคีย์การ์ดและการดูแลที่เข้มงวด' },
            { t: 'ระบบแจ้งซ่อมออนไลน์เสร็จสรรพ', d: 'ห้องพักมีปัญหาสามารถกดแจ้งซ่อมผ่านระบบแอปพลิเคชันได้ทันที มีช่างประจำตึกคอยสแตนด์บายดูแล' },
          ].map((it, i) => (
            <div key={i} className="flex items-start gap-3 mb-5 last:mb-0">
              <span className="text-[#00C853] text-xl mt-0.5">✔️</span>
              <div className="flex-1">
                <p className="text-[#333] font-bold text-sm mb-1">{it.t}</p>
                <p className="text-[#666] text-sm leading-snug">{it.d}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-[#A0AEC0] text-xs font-medium mt-10">© 2026 Around Loei. All Rights Reserved.</p>
      </div>
    </div>
  );
}
