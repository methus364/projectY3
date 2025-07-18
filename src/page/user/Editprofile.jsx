import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Editprofile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    fullName: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '0812345678',
    address: '123/45 หมู่บ้านสุขใจ ถนนสุขาภิบาล 5 แขวงสายไหม เขตสายไหม กรุงเทพฯ 10220',
  });

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว!');
    navigate('/profile'); // เปลี่ยน path ให้ตรงกับหน้าโปรไฟล์
  };

  const handleBack = () => {
    navigate('/profile'); // เปลี่ยน path ให้ตรงกับหน้าโปรไฟล์
  };

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-indigo-700 text-center mb-6">แก้ไขโปรไฟล์ลูกค้า</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-600 font-medium mb-1">ชื่อ - นามสกุล</label>
            <input
              type="text"
              name="fullName"
              value={profile.fullName}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">อีเมล</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">เบอร์โทรศัพท์</label>
            <input
              type="text"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">ที่อยู่</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
            >
              ย้อนกลับ
            </button>

            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
            >
              บันทึก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
