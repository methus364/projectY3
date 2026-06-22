import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function Editprofile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ full_name: '', email: '', phone_number: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    axios.get(`${API}/current-user`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        const d = res.data.data;
        setProfile({ full_name: d.full_name || '', email: d.email || '', phone_number: d.phone_number || '' });
      })
      .catch(() => { alert('กรุณาเข้าสู่ระบบใหม่'); navigate('/login'); })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profile.full_name.trim()) { alert('กรุณาระบุชื่อ-นามสกุล'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/profile`,
        { full_name: profile.full_name, email: profile.email || null, phone_number: profile.phone_number || null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      navigate('/profile');
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold animate-pulse">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-gray-100 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-indigo-700 text-center mb-6">แก้ไขโปรไฟล์</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-600 font-medium mb-1">ชื่อ - นามสกุล *</label>
            <input
              type="text"
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">อีเมล</label>
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-gray-600 font-medium mb-1">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              name="phone_number"
              value={profile.phone_number}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-between">
            <button type="button" onClick={() => navigate('/profile')} className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition">
              ย้อนกลับ
            </button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50">
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
