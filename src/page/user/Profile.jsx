import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    axios.get(`${API}/current-user`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setUser(res.data.data))
      .catch(() => { alert('กรุณาเข้าสู่ระบบใหม่'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const roleLabel = (role) => {
    if (role === 'Admin') return 'ผู้ดูแลระบบ';
    if (role === 'Monthly_Tenant') return 'ผู้เช่ารายเดือน';
    return 'ผู้เช่ารายวัน';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">โปรไฟล์ของฉัน</h2>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 mb-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold">
            {user.full_name?.charAt(0) || '?'}
          </div>

          <div className="w-full space-y-4">
            <div>
              <label className="text-gray-600 font-medium">ชื่อ - นามสกุล</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.full_name}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">Username</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border text-gray-500">{user.username}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">อีเมล</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.email || '-'}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">เบอร์โทรศัพท์</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{user.phone_number || '-'}</div>
            </div>

            <div>
              <label className="text-gray-600 font-medium">บทบาท</label>
              <div className="mt-1 bg-gray-50 px-4 py-2 rounded-md border">{roleLabel(user.user_role)}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={() => navigate('/Editprofile')} className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition">
              แก้ไขโปรไฟล์
            </button>
            <button onClick={() => navigate('/')} className="px-6 py-2 bg-gray-300 text-gray-800 font-medium rounded-md hover:bg-gray-400 transition">
              กลับหน้าแรก
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
