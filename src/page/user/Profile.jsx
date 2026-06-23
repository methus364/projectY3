import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="min-h-screen flex items-center justify-center text-primary font-bold animate-pulse">
      กำลังโหลด...
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto bg-card shadow-lg rounded-xl p-8">
          <h2 className="text-2xl font-bold text-center text-primary mb-6">โปรไฟล์ของฉัน</h2>

          <div className="flex flex-col items-center">
            {/* Avatar ตัวอักษรแรก */}
            <div className="w-24 h-24 mb-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold">
              {user.full_name?.charAt(0) || '?'}
            </div>

            {/* ข้อมูลพื้นฐาน */}
            <div className="w-full space-y-4">
              <Field label="ชื่อ - นามสกุล" value={user.full_name} />
              <Field label="Username" value={user.username} />
              <Field label="อีเมล" value={user.email || '-'} />
              <Field label="เบอร์โทรศัพท์" value={user.phone_number || '-'} />
              <Field label="บทบาท" value={roleLabel(user.user_role)} />
            </div>

            {/* ส่วน Social accounts */}
            <div className="w-full mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                บัญชีที่เชื่อมต่อ
              </h3>
              {socialAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มีบัญชีที่เชื่อมต่อ</p>
              ) : (
                <div className="space-y-2">
                  {socialAccounts.map((acc) => (
                    <div
                      key={acc.social_id}
                      className="flex items-center gap-3 bg-muted rounded-lg px-4 py-2"
                    >
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                          providerStyle[acc.provider] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {acc.provider}
                      </span>
                      <span className="text-sm text-foreground">{acc.provider_user_id}</span>
                      {acc.connected_at && (
                        <span className="ml-auto text-xs text-muted-foreground">
                          {acc.connected_at.split('T')[0]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ปุ่มดำเนินการ */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => navigate('/Editprofile')}
                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition"
              >
                แก้ไขโปรไฟล์
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-6 py-2 bg-muted text-foreground font-medium rounded-lg hover:bg-muted/80 transition"
              >
                กลับหน้าแรก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ช่องแสดงข้อมูล read-only
function Field({ label, value }) {
  return (
    <div>
      <label className="text-muted-foreground text-sm font-medium">{label}</label>
      <div className="mt-1 bg-muted px-4 py-2 rounded-lg text-foreground">{value}</div>
    </div>
  );
}
