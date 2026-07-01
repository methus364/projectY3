import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

export default function Editprofile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: '', email: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    api.get('/current-user')
      .then((res) => {
        const d = res.data.data;
        setProfile({ full_name: d.full_name || '', email: d.email || '', phone_number: d.phone_number || '' });
      })
      .catch(() => { alert('กรุณาเข้าสู่ระบบใหม่'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim()) { alert('กรุณาระบุชื่อ-นามสกุล'); return; }
    setSaving(true);
    try {
      await api.put('/profile', {
        full_name: profile.full_name,
        email: profile.email || null,
        phone_number: profile.phone_number || null,
      });
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      navigate('/profile');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <p className="text-[#64748B] font-bold">กำลังโหลด...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <PageHeader title="แก้ไขโปรไฟล์" subtitle="อัปเดตข้อมูลส่วนตัวของคุณ" maxWidth="max-w-md" />

      <div className="pt-6 pb-10 px-4 max-w-md mx-auto">

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 bg-white border-2 border-[#D9C5EC] rounded-full flex items-center justify-center shadow-sm mb-3">
            <span className="text-3xl text-[#5A2D82]">👤</span>
          </div>
          <p className="text-[#1E293B] text-lg font-black">{profile.full_name || 'โปรไฟล์ของฉัน'}</p>
        </div>

        {/* ฟอร์มแก้ไข */}
        <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6">
          <p className="text-[#5A2D82] font-black text-base mb-5">ข้อมูลทั่วไป</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[#334155] text-sm font-bold mb-2">ชื่อ - นามสกุล <span className="text-red-400">*</span></label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                required
                className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
              />
            </div>

            <div>
              <label className="block text-[#334155] text-sm font-bold mb-2">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                placeholder="08x-xxx-xxxx"
                className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
              />
            </div>

            <div>
              <label className="block text-[#334155] text-sm font-bold mb-2">อีเมล</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black py-3.5 rounded-2xl transition disabled:opacity-50 mt-2"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl hover:bg-[#F8FAFC] transition"
          >
            ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
