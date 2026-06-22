import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

// แมป booking_status → สีและข้อความ
const STATUS_STYLE = {
    'รอชำระมัดจำ':  { bg: 'bg-yellow-100 text-yellow-700' },
    'ยืนยันการจอง': { bg: 'bg-green-100 text-green-700'  },
    'กำลังเข้าพัก': { bg: 'bg-blue-100 text-blue-700'    },
    'ยกเลิก':       { bg: 'bg-red-100 text-red-700'      },
    'ย้ายออกแล้ว':  { bg: 'bg-gray-100 text-gray-500'    },
};

const RENT_TYPE_LABEL = {
    daily:   'รายวัน',
    monthly: 'รายเดือน',
};

export default function Roomhistory() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const user = JSON.parse(localStorage.getItem('user') || '{}');

            try {
                const res = await axios.post(
                    `${API}/checkbooking`,
                    { userId: user.id },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    setBookings(res.data.data);
                }
            } catch (err) {
                console.error("โหลดประวัติจองไม่สำเร็จ:", err);
                alert("ดึงข้อมูลการจองไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่");
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500 font-bold">กำลังโหลดประวัติการจอง...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-100 to-indigo-200 p-6 flex items-center justify-center">
            <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8">
                    ประวัติการจองห้องพัก
                </h2>

                {bookings.length === 0 ? (
                    <p className="text-center text-gray-500">ยังไม่มีข้อมูลการจอง</p>
                ) : (
                    <div className="space-y-4 mb-8">
                        {bookings.map(booking => {
                            const statusStyle = STATUS_STYLE[booking.bookingStatus] || { bg: 'bg-gray-100 text-gray-500' };
                            const price = booking.rentType === 'monthly'
                                ? `฿${Number(booking.priceMonthly || 0).toLocaleString()} / เดือน`
                                : `฿${Number(booking.pricePerDay || 0).toLocaleString()} / วัน`;

                            return (
                                <div
                                    key={booking.bookingId}
                                    className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4"
                                >
                                    <div className="flex-1">
                                        {/* Header: ห้อง + badge สถานะ */}
                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                            <p className="text-lg font-bold text-indigo-600">
                                                ห้อง {booking.roomNumber}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusStyle.bg}`}>
                                                {booking.bookingStatus}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-600">
                                                {RENT_TYPE_LABEL[booking.rentType] || booking.rentType}
                                            </span>
                                        </div>

                                        {/* รายละเอียด */}
                                        <p className="text-sm text-gray-600">
                                            เข้าพัก: {booking.startDate ? booking.startDate.split('T')[0] : '-'}
                                            &nbsp;&nbsp;|&nbsp;&nbsp;
                                            ออก: {booking.endDate ? booking.endDate.split('T')[0] : '-'}
                                        </p>
                                        {booking.roomType && (
                                            <p className="text-sm text-gray-500">{booking.roomType}</p>
                                        )}
                                        <p className="text-sm font-semibold text-gray-700 mt-1">{price}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-xl shadow"
                    >
                        ← กลับ
                    </button>
                </div>
            </div>
        </div>
    );
}
