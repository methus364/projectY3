import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // เพิ่มสำหรับ navigation

export default function Roomuser() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  const handleReset = () => {
    setSelectedType('');
    setCheckIn('');
    setCheckOut('');
    setGuests(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({
      roomType: selectedType,
      checkIn,
      checkOut,
      guests
    });
    alert("จองห้องพักเรียบร้อยแล้ว!");
    handleReset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 text-sm text-gray-500 hover:text-blue-600"
          >
            &larr; กลับหน้า Home
          </button>
          <h2 className="text-3xl font-bold text-indigo-700 dark:text-white mx-auto text-center">
            จองห้องพัก
          </h2>
        </div>

        {!selectedType ? (
          // หน้าจอแรก: เลือกประเภท
          <div className="space-y-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-lg">กรุณาเลือกประเภทห้องที่ต้องการจอง</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setSelectedType('daily')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg shadow-md"
              >
                ห้องรายวัน
              </button>
              <button
                onClick={() => setSelectedType('monthly')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg shadow-md"
              >
                ห้องรายเดือน
              </button>
            </div>
          </div>
        ) : (
          // แสดงฟอร์มจอง
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-right">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm text-gray-400 hover:text-red-500"
              >
                &larr; เปลี่ยนประเภทห้อง
              </button>
            </div>

            <h3 className="text-xl font-semibold text-center text-indigo-600 dark:text-indigo-300 mb-4">
              แบบฟอร์มจองห้อง {selectedType === 'daily' ? 'รายวัน' : 'รายเดือน'}
            </h3>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">วันที่เข้าพัก</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">วันที่ออก</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">จำนวนผู้เข้าพัก</label>
              <input
                type="number"
                min={1}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              ยืนยันการจอง
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
