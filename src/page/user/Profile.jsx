import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();

  const user = {
    fullName: 'สมชาย ใจดี',
    email: 'somchai@example.com',
    phone: '0812345678',
    address: '123/45 หมู่บ้านสุขใจ ถนนสุขาภิบาล 5 แขวงสายไหม เขตสายไหม กรุงเทพฯ 10220',
  };

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">โปรไฟล์ลูกค้า</h2>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold">
            {user.fullName.charAt(0)}
          </div>

          <div className="w-full space-y-4">
            <div>
              <label className="text-gray-600 font-medium">ชื่อ - นามสกุล</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.fullName}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">อีเมล</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.email}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">เบอร์โทรศัพท์</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.phone}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">ที่อยู่</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.address}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => navigate('/Editprofile')}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition"
            >
              แก้ไขโปรไฟล์
            </button>

            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-gray-300 text-gray-800 font-medium rounded-md hover:bg-gray-400 transition"
            >
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
