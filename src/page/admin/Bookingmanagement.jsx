import React, { useState, useEffect } from 'react';
import BookingNavbar from '../../components/admin/BookingNavbar';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const getLoggedInUser = () => {
    try {
        return JSON.parse(localStorage.getItem('user')) || {};
    } catch {
        return {};
    }
};

// แปลง booking_status ภาษาไทย (DB) → key ภาษาอังกฤษ (UI)
const STATUS_TO_UI = {
    'รอชำระมัดจำ':  'pending',
    'ยืนยันการจอง': 'confirmed',
    'กำลังเข้าพัก': 'checkin',
    'ยกเลิก':       'cancelled',
    'ย้ายออกแล้ว':  'checkout',
};

// แปลงกลับ UI key → ภาษาไทย (DB)
const UI_TO_STATUS = {
    pending:   'รอชำระมัดจำ',
    confirmed: 'ยืนยันการจอง',
    checkin:   'กำลังเข้าพัก',
    cancelled: 'ยกเลิก',
    checkout:  'ย้ายออกแล้ว',
};

// Label สำหรับแสดงใน UI
const STATUS_LABEL = {
    pending:   'รอชำระมัดจำ',
    confirmed: 'ยืนยันการจอง',
    checkin:   'กำลังเข้าพัก',
    cancelled: 'ยกเลิก',
    checkout:  'ย้ายออกแล้ว',
};

// สีแต่ละสถานะ
const STATUS_COLOR = {
    pending:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    confirmed: 'bg-green-50 text-green-700 border-green-200',
    checkin:   'bg-blue-50 text-blue-700 border-blue-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    checkout:  'bg-gray-50 text-gray-500 border-gray-200',
};

const Bookingmanagement = () => {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedDate, setSelectedDate] = useState('');
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);

    // ==========================================
    // 1. ดึงการจองทั้งหมด (Admin endpoint)
    // ==========================================
    const fetchBookings = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API}/admin/bookings`, getAuthHeader());
            if (response.data.success) {
                const formattedData = response.data.data.map(item => ({
                    id: item.bookingId,
                    memberId: item.memberId,
                    roomId: item.roomId,
                    guestName: item.guestName || item.username || 'ไม่ระบุชื่อ',
                    checkInDate: item.checkInDate ? item.checkInDate.split('T')[0] : '',
                    checkOutDate: item.checkOutDate ? item.checkOutDate.split('T')[0] : '',
                    status: STATUS_TO_UI[item.bookingStatus] || 'pending',
                    roomName: item.roomNumber,
                    pricePerDay: item.pricePerDay,
                }));
                setBookings(formattedData);
            }
        } catch (error) {
            console.error("Fetch Bookings Error:", error);
            alert("ดึงข้อมูลการจองไม่สำเร็จ — กรุณาตรวจสอบการเข้าสู่ระบบ");
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // 2. ดึงห้องพักทั้งหมดสำหรับตัวเลือกใน Modal
    // ==========================================
    const fetchRooms = async () => {
        try {
            const res = await axios.get(`${API}/getRoom`);
            if (res.data.success) {
                setRooms(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching rooms:", error);
        }
    };

    useEffect(() => {
        fetchBookings();
        fetchRooms();
    }, []);

    // ==========================================
    // 3. Logic การกรองข้อมูล
    // ==========================================
    const filteredBookings = bookings.filter(booking => {
        const matchesSearch =
            (booking.roomName?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (booking.guestName || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const matchesDate = !selectedDate ||
            (selectedDate >= booking.checkInDate && selectedDate <= booking.checkOutDate);
        return matchesSearch && matchesStatus && matchesDate;
    });

    // ==========================================
    // 4. จัดการเปิด/ปิด Modal
    // ==========================================
    const openBookingModal = (booking = null) => {
        const availableRoom = rooms.find(r => r.status === 'ว่าง');
        setCurrentBooking(booking || {
            id: null,
            roomId: availableRoom?.id || '',
            guestName: '',
            checkInDate: new Date().toISOString().split('T')[0],
            checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            status: 'pending',
        });
        setIsBookingModalOpen(true);
    };

    const closeBookingModal = () => {
        setIsBookingModalOpen(false);
        setCurrentBooking(null);
    };

    const handleBookingChange = (e) => {
        const { name, value } = e.target;
        setCurrentBooking(prev => ({ ...prev, [name]: value }));
    };

    // ==========================================
    // 5. บันทึกข้อมูลการจอง (สร้างใหม่ / แก้ไข)
    // ==========================================
    const handleSaveBooking = async (e) => {
        e.preventDefault();
        const dbStatus = UI_TO_STATUS[currentBooking.status] || 'รอชำระมัดจำ';
        const currentUser = getLoggedInUser();

        try {
            if (currentBooking.id) {
                // แก้ไขการจอง
                await axios.put(
                    `${API}/editBooking/${currentBooking.id}`,
                    {
                        roomId: parseInt(currentBooking.roomId),
                        startDate: currentBooking.checkInDate,
                        endDate: currentBooking.checkOutDate,
                        status: dbStatus,
                    },
                    getAuthHeader()
                );
                alert("แก้ไขข้อมูลการจองสำเร็จ");
            } else {
                // สร้างการจองใหม่โดย Admin (ใช้ userId ของ admin)
                await axios.post(
                    `${API}/admin/booking`,
                    {
                        roomId: parseInt(currentBooking.roomId),
                        userId: currentUser.id,
                        startDate: currentBooking.checkInDate,
                        endDate: currentBooking.checkOutDate,
                    },
                    getAuthHeader()
                );
                alert("สร้างการจองใหม่สำเร็จ");
            }
            fetchBookings();
            closeBookingModal();
        } catch (error) {
            alert(error.response?.data?.message || "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
        }
    };

    // ==========================================
    // 6. ยกเลิกรายการจอง
    // ==========================================
    const handleDeleteBooking = async (id) => {
        if (window.confirm("คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?")) {
            try {
                await axios.put(
                    `${API}/editBooking/${id}`,
                    { status: 'ยกเลิก' },
                    getAuthHeader()
                );
                alert("ยกเลิกการจองสำเร็จ");
                fetchBookings();
            } catch (error) {
                alert("ยกเลิกไม่สำเร็จ");
                console.error("Cancel Booking Error:", error);
            }
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-gray-500">กำลังโหลดข้อมูลระบบจอง...</div>;

    const availableRooms = rooms.filter(r => r.status === 'ว่าง');

    return (
        <div className="bg-gray-50 min-h-screen pb-10">
            <BookingNavbar />
            <div className="container mx-auto bg-white p-6 shadow-md rounded-xl mt-6">

                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-gray-800">จัดการรายการจอง</h1>
                    <button
                        onClick={() => openBookingModal()}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition-all active:scale-95"
                    >
                        + สร้างการจอง
                    </button>
                </div>

                {/* Filter Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">ค้นหาห้อง/ชื่อลูกค้า</label>
                        <input
                            type="text"
                            placeholder="ค้นหาเลขห้อง หรือชื่อลูกค้า..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full border-0 bg-white p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">แสดงการจองของวันที่</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full border-0 bg-white p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {selectedDate && (
                                <button onClick={() => setSelectedDate('')} className="text-red-500 text-sm font-bold hover:underline px-2">ล้าง</button>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">กรองสถานะ</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border-0 bg-white p-3 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="all">ทั้งหมด</option>
                            <option value="pending">รอชำระมัดจำ</option>
                            <option value="confirmed">ยืนยันการจอง</option>
                            <option value="checkin">กำลังเข้าพัก</option>
                            <option value="cancelled">ยกเลิก</option>
                            <option value="checkout">ย้ายออกแล้ว</option>
                        </select>
                    </div>
                </div>

                {/* ตารางแสดงข้อมูล */}
                <div className="overflow-x-auto border rounded-2xl overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-800 text-white text-xs uppercase">
                            <tr>
                                <th className="px-6 py-4 text-left font-bold">ห้อง</th>
                                <th className="px-6 py-4 text-left font-bold">ลูกค้า</th>
                                <th className="px-6 py-4 text-left font-bold">เช็คอิน - เช็คเอาท์</th>
                                <th className="px-6 py-4 text-left font-bold">ราคา/วัน</th>
                                <th className="px-6 py-4 text-left font-bold">สถานะ</th>
                                <th className="px-6 py-4 text-center font-bold">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredBookings.length > 0 ? (
                                filteredBookings.map(booking => (
                                    <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 font-black text-blue-600">ห้อง {booking.roomName}</td>
                                        <td className="px-6 py-4 font-medium">{booking.guestName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {booking.checkInDate} <span className="mx-1 text-gray-300">|</span> {booking.checkOutDate}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-700">
                                            ฿{booking.pricePerDay ? Number(booking.pricePerDay).toLocaleString() : '0'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${STATUS_COLOR[booking.status] || 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                                {STATUS_LABEL[booking.status] || booking.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-center gap-4 text-sm">
                                            <button onClick={() => openBookingModal(booking)} className="text-blue-500 font-bold hover:underline">แก้ไข</button>
                                            {booking.status !== 'cancelled' && booking.status !== 'checkout' && (
                                                <button onClick={() => handleDeleteBooking(booking.id)} className="text-red-400 font-bold hover:underline">ยกเลิก</button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-4xl">🔍</span>
                                            <p className="font-bold">ไม่พบรายการจองที่ตรงกับเงื่อนไข</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal ฟอร์ม */}
            {isBookingModalOpen && currentBooking && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleSaveBooking} className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 text-gray-800 border-b pb-4">
                            {currentBooking.id ? 'แก้ไขข้อมูลการจอง' : 'เพิ่มการจองใหม่'}
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">เลือกห้องพัก</label>
                                <select
                                    name="roomId"
                                    value={currentBooking.roomId}
                                    onChange={handleBookingChange}
                                    className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 focus:border-blue-500 outline-none transition-all"
                                    disabled={!!currentBooking.id}
                                >
                                    {currentBooking.id ? (
                                        <option value={currentBooking.roomId}>ห้อง {currentBooking.roomName}</option>
                                    ) : availableRooms.length > 0 ? (
                                        availableRooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                ห้อง {room.number} ({room.typeName || 'ทั่วไป'} - ฿{room.price}/วัน)
                                            </option>
                                        ))
                                    ) : (
                                        <option value="">--- ไม่มีห้องว่างให้เลือก ---</option>
                                    )}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">เช็คอิน</label>
                                    <input type="date" name="checkInDate" value={currentBooking.checkInDate} onChange={handleBookingChange} className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">เช็คเอาท์</label>
                                    <input type="date" name="checkOutDate" value={currentBooking.checkOutDate} onChange={handleBookingChange} className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 outline-none focus:border-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 uppercase">สถานะการจอง</label>
                                <select name="status" value={currentBooking.status} onChange={handleBookingChange} className="w-full border-2 border-gray-100 rounded-xl p-3 bg-gray-50 outline-none focus:border-blue-500">
                                    <option value="pending">รอชำระมัดจำ</option>
                                    <option value="confirmed">ยืนยันการจอง</option>
                                    <option value="checkin">กำลังเข้าพัก</option>
                                    <option value="cancelled">ยกเลิก</option>
                                    <option value="checkout">ย้ายออกแล้ว</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button type="button" onClick={closeBookingModal} className="px-6 py-3 text-gray-400 font-bold hover:bg-gray-100 rounded-xl transition-all">ยกเลิก</button>
                            <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all">
                                บันทึกข้อมูล
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Bookingmanagement;
