// import React, { useState, useMemo } from 'react';
import BookingCalendar from '../../components/admin/ฺBookingCalendar'; // <-- 1. Import ปฏิทิน
import BookingNavbar from '../../components/admin/BookingNavbar'; // <-- 2. Import Navbar




const Booking = () => {

  return (
    <>
      <BookingNavbar />
      {/* (ปรับ Layout หลัก) */}
      <div className="flex w-full flex-col bg-white p-6">
        
        {/* --- (ส่วนที่ 1: ปฏิทิน) --- */}
        <div className="mb-8">
          <BookingCalendar />
        </div>
      </div>
    </>
  )
}

export default Booking