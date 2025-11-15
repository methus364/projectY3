import React, { useState, useMemo } from 'react';
import BookingNavbar from '../../components/admin/BookingNavbar'
// --- ข้อมูลสมมติ (Mock Data) ---
const mockBookings = [
    {
        id: 1,
        bookingDate: '2025-11-05',
        moveInDate: '2025-12-01',
        room: '301',
        tenantName: 'กนกพร แสงจันทร์',
        contact: '081-123-4567',
        status: 'Pending',
    },
    {
        id: 2,
        bookingDate: '2025-11-01',
        moveInDate: '2025-11-15',
        room: '202',
        tenantName: 'จิรายุ ตั้งตรง',
        contact: '090-765-4321',
        status: 'Confirmed',
    },
    {
        id: 3,
        bookingDate: '2025-10-28',
        moveInDate: '2025-11-10',
        room: '105',
        tenantName: 'สมศักดิ์ รักเรียน',
        contact: '088-888-8888',
        status: 'Confirmed',
    },
    {
        id: 4,
        bookingDate: '2025-11-08',
        moveInDate: '2025-11-12',
        room: '401',
        tenantName: 'อารยา ใจสู้',
        contact: '065-111-2222',
        status: 'Cancelled',
    },
];

// --- ฟังก์ชันสำหรับแสดงป้ายสถานะการจอง ---
const renderBookingStatusBadge = (status) => {
    switch (status) {
        case 'Pending':
            return (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    รออนุมัติ
                </span>
            );
        case 'Confirmed':
            return (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ยืนยันแล้ว
                </span>
            );
        case 'Cancelled':
            return (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                    ยกเลิก
                </span>
            );
        default:
            return (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    {status}
                </span>
            );
    }
};
// ---------------------------------

const Bookingmanagement = () => {

    // (State สำหรับ "ตาราง")
    const [bookings, setBookings] = useState(mockBookings);

    // --- (State สำหรับตัวกรองวันที่ของ "ตาราง") ---
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: '',
    });

    const handleDateChange = (e) => {
        const { name, value } = e.target;
        setDateRange((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    // --- (Logic กรองข้อมูลของ "ตาราง") ---
    const filteredBookings = useMemo(() => {
        const { startDate, endDate } = dateRange;
        if (!startDate && !endDate) return bookings;

        return bookings.filter((book) => {
            const moveIn = book.moveInDate;
            if (startDate && !endDate) return moveIn >= startDate;
            if (!startDate && endDate) return moveIn <= endDate;
            return moveIn >= startDate && moveIn <= endDate;
        });
    }, [bookings, dateRange]);
    // ---------------------------------

    return (
        <div>
            <BookingNavbar />
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">
                    รายการจองทั้งหมด (แบบตาราง)
                </h1>

                <div className="flex flex-wrap items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 ml-2">
                        กรองวันที่ย้ายเข้า:
                    </label>
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-700 ml-2">จาก:</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={dateRange.startDate}
                        onChange={handleDateChange}
                        className="border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <label htmlFor="endDate" className="text-sm font-medium text-gray-700 ml-2">ถึง:</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={dateRange.endDate}
                        onChange={handleDateChange}
                        className="border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    {(dateRange.startDate || dateRange.endDate) && (
                        <button
                            onClick={() => setDateRange({ startDate: '', endDate: '' })}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold py-2 px-3 rounded-lg transition duration-300"
                        >
                            ล้าง
                        </button>
                    )}
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ml-3">
                        + เพิ่มการจองใหม่
                    </button>
                </div>
            </div>
            {/* (ตาราง) */}
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่จอง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ย้ายเข้า</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้อง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้จอง</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เบอร์ติดต่อ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBookings.map((book) => (
                            <tr key={book.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-700">{book.bookingDate}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{book.moveInDate}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-700">{book.room}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-900">{book.tenantName}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-700">{book.contact}</div></td>
                                <td className="px-6 py-4 whitespace-nowrap">{renderBookingStatusBadge(book.status)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {book.status === 'Pending' && (
                                        <button className="text-green-600 hover:text-green-900 mr-4 transition duration-300">ยืนยัน</button>
                                    )}
                                    {book.status !== 'Cancelled' && (
                                        <button className="text-red-600 hover:text-red-900 mr-4 transition duration-300">ยกเลิก</button>
                                    )}
                                    <button className="text-indigo-600 hover:text-indigo-900 transition duration-300">ดูรายละเอียด</button>
                                </td>
                            </tr>
                        ))}
                        {filteredBookings.length === 0 && (
                            <tr>
                                <td colSpan="7" className="text-center py-10 text-gray-500">
                                    ไม่พบรายการจองในช่วงวันที่ที่เลือก
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default Bookingmanagement
