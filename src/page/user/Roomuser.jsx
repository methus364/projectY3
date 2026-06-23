import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Roomuser() {
  const navigate = useNavigate();

  const [rentType, setRentType]         = useState('');       // 'daily' หรือ 'monthly'
  const [checkIn, setCheckIn]           = useState('');
  const [checkOut, setCheckOut]         = useState('');
  const [rooms, setRooms]               = useState([]);        // ผลจาก search-rooms
  const [searched, setSearched]         = useState(false);
  const [searching, setSearching]       = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detailRoom, setDetailRoom]     = useState(null);      // ห้องที่กดดูรายละเอียด
  const [submitting, setSubmitting]     = useState(false);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const handleReset = () => {
    setRentType('');
    setCheckIn('');
    setCheckOut('');
    setRooms([]);
    setSearched(false);
    setSelectedRoomId(null);
  };

  // ค้นหาห้องว่างจริงจาก backend (เช็ค overlap ถูกต้อง)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return;

    try {
      setSearching(true);
      const res = await axios.post(`${API}/search-rooms`, { checkIn, checkOut });
      // กรองตาม rentType — รายวันต้องมี price, รายเดือนต้องมี priceMonthly
      const filtered = (res.data.data || []).filter(room => {
        if (rentType === 'daily')   return room.price != null;
        if (rentType === 'monthly') return room.priceMonthly != null;
        return false;
      });
      setRooms(filtered);
      setSearched(true);
      setSelectedRoomId(null);
    } catch (err) {
      alert(err.response?.data?.error || 'ค้นหาห้องไม่สำเร็จ');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !checkIn || !checkOut) {
      alert('กรุณาเลือกห้องและระบุวันที่ให้ครบถ้วน');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อนจองห้อง');
      navigate('/login');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(
        `${API}/booking`,
        { roomId: selectedRoomId, startDate: checkIn, endDate: checkOut, rentType },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`จองห้อง ${selectedRoom?.number} สำเร็จ!`);
      navigate('/roomhistory');
    } catch (err) {
      alert(err.response?.data?.message || 'จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg">

        {/* Header */}
        <div className="flex justify-between items-center mb-8 relative">
          <button onClick={() => navigate('/')} className="absolute left-0 text-sm text-gray-500 hover:text-blue-600">
            &larr; กลับหน้า Home
          </button>
          <h2 className="text-3xl font-bold text-indigo-700 mx-auto text-center">จองห้องพัก</h2>
        </div>

        {/* Step 1: เลือกประเภทห้อง */}
        {!rentType ? (
          <div className="space-y-6 text-center">
            <p className="text-gray-700 text-lg">กรุณาเลือกประเภทห้องที่ต้องการจอง</p>
            <div className="flex justify-center gap-6">
              <button onClick={() => setRentType('daily')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-lg shadow-md transition-all">
                ห้องรายวัน
              </button>
              <button onClick={() => setRentType('monthly')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-lg shadow-md transition-all">
                ห้องรายเดือน
              </button>
            </div>
          </div>

        ) : (
          <div className="space-y-6">
            <div className="text-right">
              <button type="button" onClick={handleReset} className="text-sm text-gray-400 hover:text-red-500">
                &larr; เปลี่ยนประเภทห้อง
              </button>
            </div>

            <h3 className="text-xl font-semibold text-center text-indigo-600">
              จองห้อง{rentType === 'daily' ? 'รายวัน' : 'รายเดือน'}
            </h3>

            {/* Step 2: เลือกวันที่ + ค้นหา */}
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1">วันที่เข้าพัก</label>
                  <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)}
                    required className="w-full px-4 py-2 rounded-lg border" />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1">วันที่ออก</label>
                  <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)}
                    required className="w-full px-4 py-2 rounded-lg border" />
                </div>
              </div>
              <button type="submit" disabled={searching}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:bg-gray-400">
                {searching ? 'กำลังค้นหา...' : 'ค้นหาห้องว่าง'}
              </button>
            </form>

            {/* Step 3: แสดงผลห้องว่าง */}
            {searched && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-gray-700 font-medium">เลือกห้องที่ต้องการจอง</label>

                {rooms.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">ไม่มีห้องว่างในช่วงวันที่เลือก</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rooms.map(room => (
                      <div key={room.id} onClick={() => setSelectedRoomId(room.id)}
                        className={`p-4 rounded-xl border shadow transition cursor-pointer
                          ${selectedRoomId === room.id
                            ? 'ring-2 ring-indigo-500 bg-indigo-50'
                            : 'bg-white hover:ring-2 ring-indigo-300'
                          }`}>

                        {/* รูปห้อง (ถ้ามี) */}
                        {room.imageUrl && (
                          <img src={room.imageUrl} alt={`ห้อง ${room.number}`}
                            className="w-full h-32 object-cover rounded-lg mb-3" />
                        )}

                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-lg text-indigo-700">ห้อง {room.number}</h4>
                            <p className="text-sm text-gray-500">{room.typeName || 'ทั่วไป'}</p>
                            {room.roomSize && (
                              <p className="text-xs text-gray-400">{room.roomSize} ตร.ม.</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-800">
                              {rentType === 'monthly'
                                ? `฿${Number(room.priceMonthly).toLocaleString()} / เดือน`
                                : `฿${Number(room.price).toLocaleString()} / วัน`}
                            </p>
                            {room.depositAmount && (
                              <p className="text-xs text-gray-400">มัดจำ ฿{Number(room.depositAmount).toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        {/* สิ่งอำนวยความสะดวก */}
                        {room.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {room.amenities.map((a, i) => (
                              <span key={i} className="bg-indigo-50 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{a}</span>
                            ))}
                          </div>
                        )}

                        {/* ปุ่มดูรายละเอียด */}
                        {(room.description || room.amenities?.length > 0) && (
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setDetailRoom(room); }}
                            className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 underline">
                            ดูรายละเอียดเพิ่มเติม
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {rooms.length > 0 && (
                  <button type="submit" disabled={!selectedRoomId || submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg mt-2 transition disabled:bg-gray-400">
                    {submitting ? 'กำลังส่งคำขอ...' : `ยืนยันการจอง${selectedRoom ? ` (ห้อง ${selectedRoom.number})` : ''}`}
                  </button>
                )}
              </form>
            )}
          </div>
        )}
      </div>

      {/* Modal รายละเอียดห้อง */}
      {detailRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-2xl font-bold text-indigo-700 mb-4">ห้อง {detailRoom.number}</h3>

            {detailRoom.imageUrl && (
              <img src={detailRoom.imageUrl} alt={`ห้อง ${detailRoom.number}`}
                className="w-full h-48 object-cover rounded-xl mb-4" />
            )}

            <div className="space-y-3 text-gray-700">
              <p><span className="font-semibold">ประเภท:</span> {detailRoom.typeName || '-'}</p>
              {detailRoom.roomSize && (
                <p><span className="font-semibold">ขนาดห้อง:</span> {detailRoom.roomSize} ตร.ม.</p>
              )}
              <p>
                <span className="font-semibold">ราคา:</span>{' '}
                {rentType === 'monthly'
                  ? `฿${Number(detailRoom.priceMonthly).toLocaleString()} / เดือน`
                  : `฿${Number(detailRoom.price).toLocaleString()} / วัน`}
              </p>
              {detailRoom.depositAmount && (
                <p><span className="font-semibold">ค่ามัดจำ:</span> ฿{Number(detailRoom.depositAmount).toLocaleString()}</p>
              )}
              {detailRoom.description && (
                <div>
                  <p className="font-semibold mb-1">คำอธิบาย:</p>
                  <p className="text-sm text-gray-600">{detailRoom.description}</p>
                </div>
              )}
              {detailRoom.amenities?.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">สิ่งอำนวยความสะดวก:</p>
                  <div className="flex flex-wrap gap-2">
                    {detailRoom.amenities.map((a, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setDetailRoom(null)}
              className="mt-6 w-full bg-gray-100 text-gray-600 py-2 rounded-xl font-semibold hover:bg-gray-200">
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
