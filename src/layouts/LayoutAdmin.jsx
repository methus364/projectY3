import React from 'react';
import Menubar from "../components/admin/Menubar"
import { Outlet } from 'react-router-dom';

const AdminLayout = () => {
    return (
        <div className="flex bg-gray-100">
            {/* Sidebar */}
            <Menubar />

            {/* Main Content */}
            <main className="flex-grow p-6">
                <Outlet /> {/* เนื้อหาของแต่ละหน้าจะแสดงที่นี่ */}
            </main>
        </div>
    );
};

export default AdminLayout;