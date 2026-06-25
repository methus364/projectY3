import React from 'react';
import Navbar from '../../components/user/Navbar';
import Carousel from '../../components/user/Carousel';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="bg-primary/10 dark:bg-primary/5 text-foreground py-16 px-4 text-center mt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            ยินดีต้อนรับสู่ระบบจัดการหอพัก
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground">
            สมัครสมาชิกหรือเข้าสู่ระบบเพื่อใช้งานระบบจองห้อง รายวัน รายเดือน พร้อมการจัดการข้อมูลส่วนตัวอย่างง่ายดาย
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/login"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg text-lg font-semibold transition"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              to="/register"
              className="bg-card text-primary border border-primary hover:bg-primary/5 px-6 py-3 rounded-lg text-lg font-semibold transition"
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
      <section className="bg-card py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-10">ทำไมต้องใช้ระบบของเรา?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-muted rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold text-foreground mb-2">จองห้องสะดวก</h3>
              <p className="text-muted-foreground">เลือกห้อง รายวัน รายเดือน ได้จากมือถือของคุณในไม่กี่คลิก</p>
            </div>
            <div className="p-6 bg-muted rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold text-foreground mb-2">จัดการข้อมูลเอง</h3>
              <p className="text-muted-foreground">แก้ไขข้อมูลผู้ใช้ ดูสถานะการจอง และตรวจสอบประวัติได้ตลอดเวลา</p>
            </div>
            <div className="p-6 bg-muted rounded-xl shadow hover:scale-105 transition">
              <h3 className="text-xl font-semibold text-foreground mb-2">ปลอดภัยและเป็นส่วนตัว</h3>
              <p className="text-muted-foreground">เราให้ความสำคัญกับความปลอดภัยของข้อมูลผู้ใช้เป็นอันดับแรก</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-6 text-center">
        <p>&copy; {new Date().getFullYear()} ระบบจัดการหอพัก Around Loei | All rights reserved</p>
      </footer>
    </>
  );
};

export default Home;
