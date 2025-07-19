import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Roomuser() {
  const navigate = useNavigate();

  // โหลดสถานะห้องจาก localStorage หรือใช้ค่าเริ่มต้นถ้าไม่มี
  const defaultRooms = [
    // Daily rooms
    { id: 101, type: 'daily', name: 'ห้อง 101', capacity: 2, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 2 เตียง'] },
    { id: 102, type: 'daily', name: 'ห้อง 102', capacity: 2, available: false, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงคู่ 1 เตียง'] },
    { id: 103, type: 'daily', name: 'ห้อง 103', capacity: 1, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 1 เตียง'] },
    { id: 104, type: 'daily', name: 'ห้อง 104', capacity: 3, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 1 เตียง', 'เตียงคู่ 1 เตียง'] },
    // Monthly rooms
    { id: 201, type: 'monthly', name: 'ห้อง 201', capacity: 2, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงคู่ 1 เตียง'] },
    { id: 202, type: 'monthly', name: 'ห้อง 202', capacity: 4, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 4 เตียง'] },
    { id: 203, type: 'monthly', name: 'ห้อง 203', capacity: 3, available: false, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 1 เตียง', 'เตียงคู่ 1 เตียง'] },
    { id: 204, type: 'monthly', name: 'ห้อง 204', capacity: 1, available: true, features: ['ทีวี', 'ตู้เย็น', 'โต๊ะทำงาน', 'Wi-Fi', 'เตียงเดี่ยว 1 เตียง'] },
  ];

  const [roomList, setRoomList] = useState(() => {
    const storedRooms = JSON.parse(localStorage.getItem('roomList'));
    return storedRooms || defaultRooms;
  });

  const [selectedType, setSelectedType] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [selectedRooms, setSelectedRooms] = useState([]);

  const handleReset = () => {
    setSelectedType('');
    setCheckIn('');
    setCheckOut('');
    setSelectedRooms([]);
  };

  const handleRoomToggle = (roomId) => {
    setSelectedRooms((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rooms = roomList.filter((room) => selectedRooms.includes(room.id));

    const newBooking = {
      id: Date.now(),
      type: selectedType === 'daily' ? 'รายวัน' : 'รายเดือน',
      checkIn,
      checkOut,
      guests: rooms.reduce((sum, r) => sum + r.capacity, 0),
      rooms,
    };

    // บันทึกการจองลง localStorage
    const oldBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const updatedBookings = [...oldBookings, newBooking];
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));

    // อัปเดตสถานะห้องเป็นไม่ว่าง
    const updatedRooms = roomList.map(room =>
      selectedRooms.includes(room.id) ? { ...room, available: false } : room
    );
    setRoomList(updatedRooms);
    localStorage.setItem('roomList', JSON.stringify(updatedRooms));

    alert('จองห้องพักเรียบร้อยแล้ว!');
    handleReset();
    navigate('/roomhistory');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg">
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
          <div className="space-y-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 text-lg">
              กรุณาเลือกประเภทห้องที่ต้องการจอง
            </p>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">วันที่เข้าพัก</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">วันที่ออก</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 mt-4">
                เลือกห้องที่ต้องการจอง
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roomList
                  .filter((r) => r.type === selectedType)
                  .map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 rounded-xl border shadow transition cursor-pointer 
                      ${room.available
                        ? 'bg-white hover:ring-2 ring-indigo-300'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'} 
                      ${selectedRooms.includes(room.id)
                        ? 'ring-2 ring-indigo-500'
                        : ''
                      }`}
                      onClick={() => room.available && handleRoomToggle(room.id)}
                    >
                      <h4 className="font-semibold text-lg">{room.name}</h4>
                      <p>รองรับ: {room.capacity} คน</p>
                      <p>สถานะ: {room.available ? 'ว่าง' : 'ไม่ว่าง'}</p>
                      <ul className="mt-2 list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                        {room.features.map((feature, idx) => (
                          <li key={idx}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={selectedRooms.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg mt-6 transition disabled:bg-gray-400"
            >
              ยืนยันการจอง ({selectedRooms.length} ห้อง)
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
