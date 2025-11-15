import React, { useState, useMemo } from 'react';
import BookingCalendar from '../../components/admin/ฺBookingCalendar'; // <-- 1. Import ปฏิทิน
import BookingNavbar from '../../components/admin/BookingNavbar'; // <-- 2. Import Navbar
// --- (ย้ายข้อมูลและ Helper Functions มาไว้ในไฟล์เดียวกัน) ---

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
// ---------------------------------



const Booking = () => {
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
    <>
      <BookingNavbar />
      {/* (ปรับ Layout หลัก) */}
      <div className="flex w-full flex-col bg-white p-6">
        
        {/* --- (ส่วนที่ 1: ปฏิทิน) --- */}
        <div className="mb-8">
          <BookingCalendar />
        </div>

        <hr className="mb-8 border-gray-200" /> {/* (เส้นคั่น) */}

        {/* --- (ส่วนที่ 2: ตารางจัดการ) --- */}
        
        {/* (ส่วนหัว + ตัวกรองของตาราง) */}
        



      </div>
    </>
  )
}

export default Booking