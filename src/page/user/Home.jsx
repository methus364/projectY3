import React from 'react';
import Navbar from '../../components/user/Navbar';
import Carousel from '../../components/user/Carousel';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ยินดีต้อนรับสู่ระบบจัดการหอพัก
          </h1>
          <p className="text-lg md:text-xl mb-8">
            สมัครสมาชิกหรือเข้าสู่ระบบเพื่อใช้งานระบบจองห้อง รายวัน รายเดือน พร้อมการจัดการข้อมูลส่วนตัวอย่างง่ายดาย
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg text-lg font-semibold transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/register"
              className="bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg text-lg font-semibold transition dark:bg-gray-800 dark:text-white dark:border-white"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </section>

      {/* Carousel */}
      <section className="my-12">
        <Carousel />
      </section>

      {/* Features */}
      <section className="bg-white dark:bg-gray-900 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-10">
            ทำไมต้องใช้ระบบของเรา?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-2">จองห้องสะดวก</h3>
              <p>เลือกห้อง รายวัน รายเดือน ได้จากมือถือของคุณในไม่กี่คลิก</p>
            </div>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-2">จัดการข้อมูลเอง</h3>
              <p>แก้ไขข้อมูลผู้ใช้ ดูสถานะการจอง และตรวจสอบประวัติได้ตลอดเวลา</p>
            </div>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold mb-2">ปลอดภัยและเป็นส่วนตัว</h3>
              <p>เราให้ความสำคัญกับความปลอดภัยของข้อมูลผู้ใช้เป็นอันดับแรก</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-indigo-600 text-white py-6 text-center">
        <p>&copy; {new Date().getFullYear()} ระบบจัดการหอพัก | All rights reserved</p>
      </footer>
    </>
  );
};

export default Home;
