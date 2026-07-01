import React, { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('ส่งข้อความเรียบร้อยแล้ว!');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">

      {/* Header สีฟ้า */}
      <div className="bg-[#5A2D82] pt-14 pb-16 px-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-3xl">📞</span>
        </div>
        <h1 className="text-white text-2xl font-black">ติดต่อสอบถาม</h1>
        <p className="text-white/80 text-sm font-semibold mt-1">Around Loei หอพักจังหวัดเลย</p>
      </div>

      <div className="bg-white rounded-t-[40px] -mt-8 px-5 pt-7 pb-12 max-w-md mx-auto shadow-lg">

        {/* ช่องทางติดต่อ */}
        <p className="text-[#1E293B] font-black text-base mb-4">ช่องทางการติดต่อ</p>
        <div className="flex flex-col gap-3 mb-8">
          <a
            href="https://line.me/ti/p/~aroundloei"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-4 bg-[#06C755] text-white p-4 rounded-[18px] hover:opacity-90 transition group"
          >
            <span className="text-xl">💬</span>
            <span className="flex-1 font-bold">Line Official</span>
            <span className="group-hover:translate-x-1 transition">›</span>
          </a>
          <a
            href="https://facebook.com/aroundloei"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-4 bg-[#1877F2] text-white p-4 rounded-[18px] hover:opacity-90 transition group"
          >
            <span className="text-xl">📘</span>
            <span className="flex-1 font-bold">Facebook</span>
            <span className="group-hover:translate-x-1 transition">›</span>
          </a>
          <a
            href="tel:0812345678"
            className="flex items-center gap-4 bg-[#FF5E1F] text-white p-4 rounded-[18px] hover:opacity-90 transition group"
          >
            <span className="text-xl">📞</span>
            <span className="flex-1 font-bold">081-234-5678</span>
            <span className="group-hover:translate-x-1 transition">›</span>
          </a>
        </div>

        {/* ฟอร์มส่งข้อความ */}
        <p className="text-[#1E293B] font-black text-base mb-4">ส่งข้อความหาเรา</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#334155] text-sm font-bold mb-2">ชื่อของคุณ</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              placeholder="กรอกชื่อของคุณ"
              className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
            />
          </div>
          <div>
            <label className="block text-[#334155] text-sm font-bold mb-2">อีเมล</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="example@email.com"
              className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
            />
          </div>
          <div>
            <label className="block text-[#334155] text-sm font-bold mb-2">ข้อความ</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows={4}
              placeholder="พิมพ์ข้อความที่ต้องการสอบถาม..."
              className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition"
          >
            ส่งข้อความ
          </button>
        </form>
      </div>
    </div>
  );
}
