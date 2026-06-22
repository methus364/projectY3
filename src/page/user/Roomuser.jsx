import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Roomuser() {
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rentType, setRentType] = useState(''); // 'daily' หรือ 'monthly'
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // โหลดห้องทั้งหมดจาก API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await axios.get(`${API}/getRoom`);
        if (res.data.success) {
          setRooms(res.data.data);
        }
      } catch (err) {
        console.error("โหลดห้องพักไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // กรองห้องตามประเภทที่เลือกและห้องต้องว่าง
  const availableRooms = rooms.filter(room => {
    if (room.status !== 'ว่าง') return false;
    if (rentType === 'daily')   return room.price != null;
    if (rentType === 'monthly') return room.priceMonthly != null;
    return false;
  });

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const handleReset = () => {
    setRentType('');
    setCheckIn('');
    setCheckOut('');
    setSelectedRoomId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedRoomId || !checkIn || !checkOut) {
      alert("กรุณาเลือกห้องและระบุวันที่ให้ครบถ้วน");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนจองห้อง");
      navigate('/login');
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    try {
      setSubmitting(true);
      await axios.post(
        `${API}/booking`,
        {
          roomId:    selectedRoomId,
          userId:    user.id,
          startDate: checkIn,
          endDate:   checkOut,
          rentType,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`จองห้อง ${selectedRoom?.number} สำเร็จ!`);
      navigate('/roomhistory');
    } catch (err) {
      alert(err.response?.data?.message || "จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 font-bold">กำลังโหลดข้อมูลห้องพัก...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-0 text-sm text-gray-500 hover:text-blue-600"
          >
            &larr; กลับหน้า Home
          </button>
          <h2 className="text-3xl font-bold text-indigo-700 mx-auto text-center">
            จองห้องพัก
          </h2>
        </div>

        {/* Step 1: เลือกประเภทห้อง */}
        {!rentType ? (
          <div className="space-y-6 text-center">
            <p className="text-gray-700 text-lg">กรุณาเลือกประเภทห้องที่ต้องการจอง</p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => setRentType('daily')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg shadow-md transition-all"
              >
                ห้องรายวัน
              </button>
              <button
                onClick={() => setRentType('monthly')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg shadow-md transition-all"
              >
                ห้องรายเดือน
              </button>
            </div>
          </div>

        ) : (
          // Step 2: กรอกวันที่และเลือกห้อง
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-right">
              <button type="button" onClick={handleReset} className="text-sm text-gray-400 hover:text-red-500">
                &larr; เปลี่ยนประเภทห้อง
              </button>
            </div>

            <h3 className="text-xl font-semibold text-center text-indigo-600 mb-4">
              จองห้อง{rentType === 'daily' ? 'รายวัน' : 'รายเดือน'}
            </h3>

            {/* วันที่เข้าพัก/ออก */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">วันที่เข้าพัก</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">วันที่ออก</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border"
                />
              </div>
            </div>

            {/* รายการห้องที่ว่าง */}
            <div>
              <label className="block text-gray-700 mb-2 mt-4">เลือกห้องที่ต้องการจอง</label>

              {availableRooms.length === 0 ? (
                <p className="text-center text-gray-400 py-8">ไม่มีห้องว่างสำหรับประเภทที่เลือก</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableRooms.map(room => (
                    <div
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`p-4 rounded-xl border shadow transition cursor-pointer
                        ${selectedRoomId === room.id
                          ? 'ring-2 ring-indigo-500 bg-indigo-50'
                          : 'bg-white hover:ring-2 ring-indigo-300'
                        }`}
                    >
                      <h4 className="font-semibold text-lg text-indigo-700">ห้อง {room.number}</h4>
                      <p className="text-sm text-gray-500">{room.typeName || 'ทั่วไป'}</p>
                      <p className="font-bold text-gray-800 mt-1">
                        {rentType === 'monthly'
                          ? `฿${Number(room.priceMonthly).toLocaleString()} / เดือน`
                          : `฿${Number(room.price).toLocaleString()} / วัน`
                        }
                      </p>
                      {room.depositAmount && (
                        <p className="text-xs text-gray-400">ค่ามัดจำ ฿{Number(room.depositAmount).toLocaleString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={!selectedRoomId || submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg mt-6 transition disabled:bg-gray-400"
            >
              {submitting ? 'กำลังส่งคำขอ...' : `ยืนยันการจอง${selectedRoom ? ` (ห้อง ${selectedRoom.number})` : ''}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
