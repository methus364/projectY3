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
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-card shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold text-primary mb-4">ติดต่อสอบถาม</h2>
        <p className="text-muted-foreground mb-6">
          หากคุณมีคำถามเกี่ยวกับการจองห้องพัก สามารถติดต่อเราผ่านเบอร์โทรศัพท์ หรือส่งข้อความหาเราได้เลย
        </p>

        {/* เบอร์ติดต่อ */}
        <div className="mb-8">
          <p className="text-lg font-medium text-foreground">📞 โทร: <a href="tel:0123456789" className="text-primary hover:underline">012-345-6789</a></p>
        </div>

        {/* ฟอร์มติดต่อ */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-foreground">ชื่อของคุณ</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-border rounded-md focus:ring-primary focus:border-primary"
              placeholder="กรอกชื่อของคุณ"
            />
          </div>
          <div>
            <label className="block text-foreground">อีเมล</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full mt-1 px-4 py-2 border border-border rounded-md focus:ring-primary focus:border-primary"
              placeholder="example@email.com"
            />
          </div>
          <div>
            <label className="block text-foreground">ข้อความ</label>
            <textarea
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              rows="4"
              className="w-full mt-1 px-4 py-2 border border-border rounded-md focus:ring-primary focus:border-primary"
              placeholder="พิมพ์ข้อความที่ต้องการสอบถาม..."
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded hover:bg-primary/90 transition"
          >
            ส่งข้อความ
          </button>
        </form>
      </div>
    </div>
  );
}
