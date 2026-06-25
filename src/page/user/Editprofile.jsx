import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

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
    <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse">
      กำลังโหลด...
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full bg-card shadow-lg rounded-xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-primary text-center mb-6">แก้ไขโปรไฟล์</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-foreground font-medium mb-1">ชื่อ - นามสกุล *</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-foreground font-medium mb-1">อีเมล</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-foreground font-medium mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                className="w-full rounded-lg border border-border bg-background text-foreground px-4 py-2 focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition disabled:opacity-50"
              >
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
