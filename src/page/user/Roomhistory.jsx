import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Roomhistory() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const storedBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    setBookings(storedBookings);
  }, []);

  const handleCancelBooking = (id) => {
    const bookingToCancel = bookings.find(b => b.id === id);
    if (!bookingToCancel) return;

    // คืนสถานะห้องเป็น 'available'
    const storedRooms = JSON.parse(localStorage.getItem('roomList') || '[]');
    const bookedRoomIds = bookingToCancel.rooms?.map(r => r.id) || [];

    const updatedRooms = storedRooms.map(room =>
      bookedRoomIds.includes(room.id)
        ? { ...room, status: 'available' }
        : room
    );

    localStorage.setItem('roomList', JSON.stringify(updatedRooms));

    // ลบการจองออก
    const newBookings = bookings.filter(booking => booking.id !== id);
    setBookings(newBookings);
    localStorage.setItem('bookings', JSON.stringify(newBookings));
  };

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
                <div className="w-full sm:w-3/4">
                  <p className="text-lg font-semibold text-indigo-600 dark:text-indigo-300">
                    การจองห้องประเภท: {booking.type === 'daily' ? 'รายวัน' : 'รายเดือน'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    เข้าพัก: {booking.checkIn} &nbsp;&nbsp; ออก: {booking.checkOut}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ผู้เข้าพัก: {booking.guests} คน
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    รายละเอียดห้อง:
                    <ul className="list-disc list-inside mt-1">
                      {booking.rooms?.map((room) => (
                        <li key={room.id}>
                          {room.name} (รองรับ {room.capacity} คน)
                        </li>
                      ))}
                    </ul>
                  </p>
                </div>

                <div className="flex flex-col sm:items-end w-full sm:w-auto">
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="mt-2 sm:mt-0 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
                  >
                    ยกเลิกการจอง
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl shadow"
          >
            ← กลับ
          </button>
        </div>
      </div>
    </div>
  );
}
