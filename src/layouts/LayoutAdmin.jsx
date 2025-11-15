import React from 'react';
import Menubar from "../components/admin/Menubar"
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        // 1. เพิ่ม h-screen และ overflow-hidden ที่ div แม่
        <div className="flex bg-gray-100 h-screen overflow-hidden">
            {/* Sidebar */}
            <Menubar />

            {/* Main Content */}
            {/* 2. เพิ่ม overflow-y-auto ที่ main */}
            <main className="flex-grow p-6 overflow-y-auto">
                <Outlet /> {/* เนื้อหาของแต่ละหน้าจะแสดงที่นี่ */}
            </main>
        </div>
    );
};

export default AdminLayout;