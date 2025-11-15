import React, { useMemo } from 'react';


// --- Import FullCalendar ---
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Plugin สำหรับ Month View

// --- (เราจะใช้ข้อมูล Mockup ชุดนี้ชั่วคราวก่อน) ---
const mockBookings = [
  { id: 1, bookingDate: '2025-11-05', moveInDate: '2025-12-01', room: '301', tenantName: 'กนกพร แสงจันทร์', status: 'Pending' },
  { id: 2, bookingDate: '2025-11-01', moveInDate: '2025-11-15', room: '202', tenantName: 'จิรายุ ตั้งตรง', status: 'Confirmed' },
  { id: 3, bookingDate: '2025-10-28', moveInDate: '2025-11-10', room: '105', tenantName: 'สมศักดิ์ รักเรียน', status: 'Confirmed' },
  { id: 4, bookingDate: '2025-11-08', moveInDate: '2025-11-12', room: '401', tenantName: 'อารยา ใจสู้', status: 'Cancelled' },
  { id: 5, bookingDate: '2025-11-10', moveInDate: '2025-11-10', room: '302', tenantName: 'วิชัย', status: 'Confirmed' },
];
// ---------------------------------

function BookingCalendar() {

  // --- แปลงข้อมูล 'mockBookings' เป็น 'events' ---
  const bookingEvents = useMemo(() => {
    return mockBookings
      .filter(book => book.status === 'Confirmed') // แสดงเฉพาะการจองที่ "ยืนยันแล้ว"
      .map(book => ({
        id: book.id,
        title: `ห้อง ${book.room} (${book.tenantName})`, // สิ่งที่แสดงบนปฏิทิน
        start: book.moveInDate, // วันที่เริ่ม
        
        // --- การใส่สี ---
        backgroundColor: '#10B981', // สีเขียว (Confirmed)
        borderColor: '#059669',
      }));
  }, []); // (ใช้ [] (ว่าง) เพราะข้อมูลเป็น mock, ถ้าข้อมูลเปลี่ยนได้ให้ใช้ [mockBookings])

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        ปฏิทินการจองห้องพัก (แสดงวันที่ย้ายเข้า)
      </h2>
      
      {/* นี่คือ Component ของ FullCalendar */}
      <FullCalendar
        plugins={[ dayGridPlugin ]}
        initialView="dayGridMonth"
        events={bookingEvents}
        
        // (เราสามารถปรับแต่ง Header ได้)
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth' // (แสดงแค่รายเดือน)
        }}
        
        // (ตั้งค่าภาษาไทย - ต้อง import locale เพิ่มถ้าจะใช้)
        // locale="th" 
      />
    </div>
  );
}

export default BookingCalendar;