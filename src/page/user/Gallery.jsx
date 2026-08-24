import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// หน้า "แกลเลอรี่" — อ้างอิง mobile app: app/(tabs)/gallery.js (ธีมฟ้า)
const CATEGORIES = [
  { id: 'ALL', label: 'ทั้งหมด' },
  { id: 'DAILY', label: 'ห้องรายวัน' },
  { id: 'MONTHLY', label: 'ห้องรายเดือน' },
  { id: 'AMBIENT', label: 'บรรยากาศ & ที่จอดรถ' },
];

const GALLERY = [
  { id: '1', category: 'DAILY', title: 'ห้องรายวัน Standard', url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=800' },
  { id: '2', category: 'DAILY', title: 'ห้องน้ำรายวัน สะอาดกว้างขวาง', url: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800' },
  { id: '3', category: 'DAILY', title: 'ห้องรายวัน Deluxe Double Bed', url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800' },
  { id: '4', category: 'MONTHLY', title: 'ห้องรายเดือน พร้อมเฟอร์นิเจอร์', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800' },
  { id: '5', category: 'MONTHLY', title: 'มุมห้องครัวและซิงก์ล้างจาน', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=800' },
  { id: '6', category: 'MONTHLY', title: 'ห้องรายเดือน ตกแต่งสไตล์มินิมอล', url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=800' },
  { id: '7', category: 'AMBIENT', title: 'บรรยากาศตึก Around Loei', url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800' },
  { id: '8', category: 'AMBIENT', title: 'พื้นที่จอดรถกว้างขวาง ปลอดภัย', url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=800' },
  { id: '9', category: 'AMBIENT', title: 'ทางเข้าหน้าหอพัก ติดถนนใหญ่', url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800' },
];

export default function Gallery() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedImage, setSelectedImage] = useState(null);

  const filtered = activeTab === 'ALL' ? GALLERY : GALLERY.filter((x) => x.category === activeTab);

  return (
    <div className="min-h-screen bg-[#0194F3] flex flex-col">
      {/* Header */}
      <div className="bg-[#0178C7] px-4 py-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-white font-bold text-sm w-16">← กลับ</button>
        <h1 className="text-white text-lg font-black">แกลเลอรี่</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 bg-[#F8F9FA] rounded-t-[35px] overflow-hidden">
        {/* แถบตัวกรอง */}
        <div className="bg-white py-3 border-b border-[#E2E8F0]">
          <div className="flex gap-2.5 px-4 overflow-x-auto">
            {CATEGORIES.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border transition ${
                    selected ? 'bg-[#0194F3] border-[#0194F3] text-white' : 'bg-[#F1F5F9] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ตารางรูป */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-20 text-[#94A3B8]">
            <span className="text-5xl mb-2">🖼️</span>
            <p className="font-bold text-sm">ไม่พบรูปภาพในหมวดหมู่นี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4">
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedImage(item)}
                className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group"
              >
                <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                <span className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[11px] font-bold py-1.5 px-2 truncate text-center">
                  {item.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal ดูรูปใหญ่ */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <button onClick={() => setSelectedImage(null)} className="absolute top-6 right-6 text-white text-4xl">×</button>
          <img src={selectedImage.url} alt={selectedImage.title} className="max-w-[90%] max-h-[75%] object-contain rounded-xl" />
          <p className="text-white font-bold mt-4 text-center">{selectedImage.title}</p>
        </div>
      )}
    </div>
  );
}
