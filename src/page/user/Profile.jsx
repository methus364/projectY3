import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    // โหลดข้อมูลผู้ใช้ + บัญชี social พร้อมกัน
    Promise.all([
      api.get('/current-user'),
      api.get('/my-social-accounts'),
    ])
      .then(([userRes, socialRes]) => {
        if (userRes.data.success) setUser(userRes.data.data);
        if (socialRes.data.success) setSocialAccounts(socialRes.data.data || []);
      })
      .catch(() => { alert('กรุณาเข้าสู่ระบบใหม่'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const roleLabel = (role) => {
    if (role === 'Admin') return 'ผู้ดูแลระบบ';
    if (role === 'Monthly_Tenant') return 'ผู้เช่ารายเดือน';
    return 'ผู้เช่ารายวัน';
  };

  // แมปชื่อ provider → ป้ายสี
  const providerStyle = {
    line:   'bg-green-100 text-green-700',
    google: 'bg-blue-100 text-blue-700',
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <p className="text-[#64748B] font-bold">กำลังโหลด...</p>
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />

      <div className="pt-20 pb-10 px-4 max-w-md mx-auto">

        {/* Avatar + ชื่อ */}
        <div className="bg-[#5A2D82] rounded-3xl p-6 mb-4 flex flex-col items-center shadow-sm">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-black text-white mb-3">
            {user.full_name?.charAt(0) || '?'}
          </div>
          <p className="text-white text-xl font-black">{user.full_name}</p>
          <p className="text-white/70 text-sm font-semibold mt-1">@{user.username}</p>
          <span className="mt-2 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">
            {roleLabel(user.user_role)}
          </span>
        </div>

        {/* ข้อมูลพื้นฐาน */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5 mb-4">
          <p className="text-[#5A2D82] font-black text-sm mb-4">ข้อมูลส่วนตัว</p>
          <div className="space-y-3">
            <Field label="ชื่อ - นามสกุล" value={user.full_name} />
            <Field label="Username" value={user.username} />
            <Field label="อีเมล" value={user.email || '-'} />
            <Field label="เบอร์โทรศัพท์" value={user.phone_number || '-'} />
          </div>
        </div>

        {/* Social accounts */}
        {socialAccounts.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5 mb-4">
            <p className="text-[#334155] font-black text-sm mb-3">บัญชีที่เชื่อมต่อ</p>
            <div className="space-y-2">
              {socialAccounts.map((acc) => (
                <div
                  key={acc.social_id}
                  className="flex items-center gap-3 bg-[#F8FAFC] rounded-2xl px-4 py-2.5"
                >
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${providerStyle[acc.provider] || 'bg-gray-100 text-gray-600'}`}>
                    {acc.provider}
                  </span>
                  <span className="text-sm text-[#334155] font-semibold flex-1">{acc.provider_user_id}</span>
                  {acc.connected_at && (
                    <span className="text-xs text-[#94A3B8]">{acc.connected_at.split('T')[0]}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ปุ่ม */}
        <button
          onClick={() => navigate('/Editprofile')}
          className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition mb-3"
        >
          แก้ไขโปรไฟล์
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-white border border-[#E2E8F0] text-[#64748B] font-bold py-3 rounded-2xl hover:bg-[#F8FAFC] transition mb-3"
        >
          กลับหน้าแรก
        </button>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-red-50 border border-red-200 text-red-500 font-bold py-3 rounded-2xl hover:bg-red-100 transition"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Modal ยืนยัน logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚪</span>
              </div>
              <h2 className="text-[#1E293B] text-lg font-black">ออกจากระบบ?</h2>
              <p className="text-[#64748B] text-sm mt-1">คุณต้องการออกจากระบบใช่ไหม</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl transition"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ช่องแสดงข้อมูล read-only
function Field({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#F1F5F9] last:border-0">
      <span className="text-[#94A3B8] text-sm font-semibold">{label}</span>
      <span className="text-[#1E293B] text-sm font-bold text-right max-w-[55%] break-all">{value}</span>
    </div>
  );
}
