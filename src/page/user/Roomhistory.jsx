import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ เพิ่มเพื่อใช้ปุ่มกลับ

export default function Roomhistory() {
  const navigate = useNavigate(); // ✅ ใช้งาน navigate

  const [bookings, setBookings] = useState([
    {
      id: 1,
      type: 'รายวัน',
      checkIn: '2025-07-20',
      checkOut: '2025-07-22',
      guests: 2,
    },
    {
      id: 2,
      type: 'รายเดือน',
      checkIn: '2025-08-01',
      checkOut: '2025-08-31',
      guests: 1,
    },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold text-center text-indigo-700 dark:text-white mb-8">
          ประวัติการจองห้องพัก
        </h2>

        {bookings.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400">ไม่มีข้อมูลการจอง</p>
        ) : (
          <div className="space-y-6 mb-8">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-indigo-50 dark:bg-gray-800 border border-indigo-200 dark:border-gray-700 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4"
              >
                <div>
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                    ห้อง{booking.type}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    เข้าพัก: {booking.checkIn} &nbsp;&nbsp; ออก: {booking.checkOut}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ผู้เข้าพัก: {booking.guests} คน
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ✅ ปุ่มกลับ */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)} // ย้อนกลับหน้าก่อน
            className="mt-4 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl shadow"
          >
            ← กลับ
          </button>
        </div>
      </div>
    </div>
  );
}
