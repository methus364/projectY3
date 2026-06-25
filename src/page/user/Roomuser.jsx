import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

export default function Roomuser() {
  const navigate = useNavigate();

  const [rentType, setRentType]             = useState('');
  const [checkIn, setCheckIn]               = useState('');
  const [checkOut, setCheckOut]             = useState('');
  const [rooms, setRooms]                   = useState([]);
  const [searched, setSearched]             = useState(false);
  const [searching, setSearching]           = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [detailRoom, setDetailRoom]         = useState(null);
  const [submitting, setSubmitting]         = useState(false);

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
      const res = await api.post('/search-rooms', { checkIn, checkOut });
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
      await api.post('/booking', { roomId: selectedRoomId, startDate: checkIn, endDate: checkOut, rentType });
      alert(`จองห้อง ${selectedRoom?.number} สำเร็จ!`);
      navigate('/roomhistory');
    } catch (err) {
      alert(err.response?.data?.message || 'จองไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4 max-w-3xl mx-auto">
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8">

          <div className="flex justify-between items-center mb-8">
            <button onClick={() => navigate('/')} className="text-sm text-muted-foreground hover:text-primary">
              &larr; กลับหน้า Home
            </button>
            <h2 className="text-2xl font-bold text-primary">จองห้องพัก</h2>
            <div className="w-24" />
          </div>

          {/* Step 1: เลือกประเภทห้อง */}
          {!rentType ? (
            <div className="space-y-6 text-center">
              <p className="text-foreground text-lg">กรุณาเลือกประเภทห้องที่ต้องการจอง</p>
              <div className="flex justify-center gap-6 flex-wrap">
                <button
                  onClick={() => setRentType('daily')}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-lg shadow-sm transition"
                >
                  ห้องรายวัน
                </button>
                <button
                  onClick={() => setRentType('monthly')}
                  className="px-6 py-3 bg-secondary hover:bg-secondary/80 text-white rounded-xl text-lg shadow-sm transition"
                >
                  ห้องรายเดือน
                </button>
              </div>
            </div>

          ) : (
            <div className="space-y-6">
              <div className="text-right">
                <button type="button" onClick={handleReset} className="text-sm text-muted-foreground hover:text-destructive">
                  &larr; เปลี่ยนประเภทห้อง
                </button>
              </div>

              <h3 className="text-xl font-semibold text-center text-primary">
                จองห้อง{rentType === 'daily' ? 'รายวัน' : 'รายเดือน'}
              </h3>

              {/* Step 2: เลือกวันที่ + ค้นหา */}
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-foreground mb-1">วันที่เข้าพัก</label>
                    <input
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-foreground mb-1">วันที่ออก</label>
                    <input
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {searching ? 'กำลังค้นหา...' : 'ค้นหาห้องว่าง'}
                </button>
              </form>

              {/* Step 3: แสดงผลห้องว่าง */}
              {searched && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <label className="block text-foreground font-medium">เลือกห้องที่ต้องการจอง</label>

                  {rooms.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">ไม่มีห้องว่างในช่วงวันที่เลือก</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rooms.map(room => (
                        <div
                          key={room.id}
                          onClick={() => setSelectedRoomId(room.id)}
                          className={`p-4 rounded-xl border shadow-sm transition cursor-pointer
                            ${selectedRoomId === room.id
                              ? 'ring-2 ring-primary bg-primary/5 border-primary'
                              : 'border-border bg-card hover:ring-2 ring-primary/40'
                            }`}
                        >
                          {room.imageUrl && (
                            <img
                              src={room.imageUrl}
                              alt={`ห้อง ${room.number}`}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}

                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-lg text-primary">ห้อง {room.number}</h4>
                              <p className="text-sm text-muted-foreground">{room.typeName || 'ทั่วไป'}</p>
                              {room.roomSize && (
                                <p className="text-xs text-muted-foreground">{room.roomSize} ตร.ม.</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-foreground">
                                {rentType === 'monthly'
                                  ? `฿${Number(room.priceMonthly).toLocaleString()} / เดือน`
                                  : `฿${Number(room.price).toLocaleString()} / วัน`}
                              </p>
                              {room.depositAmount && (
                                <p className="text-xs text-muted-foreground">
                                  มัดจำ ฿{Number(room.depositAmount).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>

                          {room.amenities?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.amenities.map((a, i) => (
                                <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{a}</span>
                              ))}
                            </div>
                          )}

                          {(room.description || room.amenities?.length > 0) && (
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setDetailRoom(room); }}
                              className="mt-2 text-xs text-primary hover:text-primary/70 underline"
                            >
                              ดูรายละเอียดเพิ่มเติม
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {rooms.length > 0 && (
                    <button
                      type="submit"
                      disabled={!selectedRoomId || submitting}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 px-4 rounded-lg mt-2 transition disabled:opacity-50"
                    >
                      {submitting
                        ? 'กำลังส่งคำขอ...'
                        : `ยืนยันการจอง${selectedRoom ? ` (ห้อง ${selectedRoom.number})` : ''}`}
                    </button>
                  )}
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal รายละเอียดห้อง */}
      {detailRoom && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6 border border-border">
            <h3 className="text-2xl font-bold text-primary mb-4">ห้อง {detailRoom.number}</h3>

            {detailRoom.imageUrl && (
              <img
                src={detailRoom.imageUrl}
                alt={`ห้อง ${detailRoom.number}`}
                className="w-full h-48 object-cover rounded-xl mb-4"
              />
            )}

            <div className="space-y-3 text-foreground">
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
                  <p className="text-sm text-muted-foreground">{detailRoom.description}</p>
                </div>
              )}
              {detailRoom.amenities?.length > 0 && (
                <div>
                  <p className="font-semibold mb-2">สิ่งอำนวยความสะดวก:</p>
                  <div className="flex flex-wrap gap-2">
                    {detailRoom.amenities.map((a, i) => (
                      <span key={i} className="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full font-medium">{a}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setDetailRoom(null)}
              className="mt-6 w-full bg-muted text-foreground py-2 rounded-xl font-semibold hover:bg-muted/80"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
