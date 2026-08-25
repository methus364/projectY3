import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

// รายการ provider ที่รองรับ (ใช้แสดงในการ์ด "บัญชีที่เชื่อม")
// key ต้องตรงกับค่าใน social_accounts.provider ('google' / 'line')
const SOCIAL_PROVIDERS = [
  { key: 'google', label: 'Google', short: 'G', color: '#EA4335' },
  { key: 'line', label: 'LINE', short: 'L', color: '#06C755' },
];

// แก้ไขโปรไฟล์ — อ้างอิง mobile app: app/(tabs)/profileedit.js (ธีมฟ้า, header เอง, ชื่อ read-only, success modal)
export default function Editprofile() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [socialProviders, setSocialProviders] = useState([]); // รายชื่อ provider ที่ผูกไว้ เช่น ['google']
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    api.get('/current-user')
      .then((res) => {
        const d = res.data.data;
        setForm({ name: d.full_name || '', phone: d.phone_number || '', email: d.email || '' });
      })
      .catch(() => { alert('กรุณาเข้าสู่ระบบใหม่'); navigate('/login'); })
      .finally(() => setLoading(false));

    // ดึงบัญชี social ที่ผูกไว้มาแสดง (แสดงอย่างเดียว — ยังไม่มีปุ่มเชื่อม/ถอดในเฟสนี้)
    api.get('/my-social-accounts')
      .then((res) => {
        const providers = (res.data.data || []).map((row) => row.provider);
        setSocialProviders(providers);
      })
      .catch(() => { /* ถ้าดึงไม่ได้ก็แค่ไม่แสดงการ์ด ไม่ต้องขัดจังหวะหน้าหลัก */ });
  }, [navigate]);

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      setErrorMsg('');
      await api.put('/profile', { full_name: form.name, email: form.email, phone_number: form.phone });
      // sync localStorage 'user' ให้ตรง
      try {
        const old = JSON.parse(localStorage.getItem('user')) || {};
        localStorage.setItem('user', JSON.stringify({ ...old, full_name: form.name, name: form.name, email: form.email, phone_number: form.phone }));
      } catch { /* ไม่เป็นไร */ }
      setSuccessVisible(true);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full border border-[#CBD5E1] rounded-2xl px-3.5 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#0194F3]';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#BAE6FD] border-t-[#0194F3] rounded-full animate-spin" />
        <p className="text-[#334155] font-semibold mt-3">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header ฟ้า + ปุ่มย้อนกลับ (แบบ mobile) */}
      <div className="bg-[#0178C7] px-4 py-3.5 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white">←</button>
        <h1 className="text-white text-lg font-black">แก้ไขโปรไฟล์</h1>
        <div className="w-9" />
      </div>

      <div className="p-5 pb-10 max-w-md mx-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-5">
          <div className="w-[90px] h-[90px] rounded-full bg-white border-2 border-[#BAE6FD] flex items-center justify-center mb-2.5 text-4xl text-[#0194F3]">👤</div>
          <p className="text-[#1E293B] text-lg font-black">{form.name || 'Your Profile'}</p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl px-3.5 py-3 mb-4">
            <span className="text-[#DC2626]">⚠️</span>
            <p className="flex-1 text-[#DC2626] text-sm font-bold">{errorMsg}</p>
          </div>
        )}

        {/* การ์ดฟอร์ม */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5">
          <p className="text-[#0194F3] text-lg font-black mb-4">ข้อมูลทั่วไป</p>

          {/* ชื่อ-นามสกุล: read-only เหมือน mobile */}
          <label className="block text-[#334155] text-[13px] font-bold mb-2 mt-2.5">ชื่อ-นามสกุล</label>
          <input value={form.name} readOnly className={inputClass + ' opacity-90 cursor-not-allowed'} />

          <label className="block text-[#334155] text-[13px] font-bold mb-2 mt-2.5">Phone Number</label>
          <input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} type="tel" placeholder="กรอกเบอร์โทรศัพท์" className={inputClass} />

          <label className="block text-[#334155] text-[13px] font-bold mb-2 mt-2.5">Email</label>
          <input value={form.email} onChange={(e) => handleChange('email', e.target.value)} type="email" placeholder="กรอกอีเมล" className={inputClass} />
        </div>

        {/* การ์ดบัญชีที่เชื่อม (แสดงอย่างเดียว) — โชว์ว่าเชื่อม Google/LINE ไว้แล้วหรือยัง */}
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 mt-4">
          <p className="text-[#0194F3] text-lg font-black mb-4">บัญชีที่เชื่อม</p>
          {SOCIAL_PROVIDERS.map((p) => {
            const connected = socialProviders.includes(p.key);
            return (
              <div key={p.key} className="flex items-center gap-3 py-2.5">
                {/* ไอคอนวงกลมตามสีของ provider */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black" style={{ backgroundColor: p.color }}>
                  {p.short}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[#1E293B] text-sm font-bold">{p.label}</p>
                  {/* Google ใช้อีเมลเดียวกับบัญชี → โชว์อีเมลคู่ไว้ให้รู้ว่าเชื่อมด้วยเมลไหน */}
                  {connected && p.key === 'google' && form.email && (
                    <p className="text-[#64748B] text-xs truncate">{form.email}</p>
                  )}
                </div>
                {connected ? (
                  <span className="text-[#16A34A] text-xs font-bold bg-[#DCFCE7] px-3 py-1 rounded-full">✓ เชื่อมแล้ว</span>
                ) : (
                  <span className="text-[#94A3B8] text-xs font-bold bg-[#F1F5F9] px-3 py-1 rounded-full">ยังไม่เชื่อม</span>
                )}
              </div>
            );
          })}
        </div>

        <button onClick={handleSave} disabled={saving} className="w-full mt-4 bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-4 rounded-2xl transition disabled:opacity-70">
          {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
        </button>
      </div>

      {/* Success modal */}
      {successVisible && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl p-6 w-full max-w-[340px] flex flex-col items-center">
            <span className="text-5xl text-[#16A34A] mb-2.5">✓</span>
            <p className="text-[#0F172A] text-xl font-black mb-1.5">อัปเดตข้อมูลแล้ว</p>
            <p className="text-[#64748B] text-sm text-center mb-5">บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว</p>
            <button
              onClick={() => { setSuccessVisible(false); navigate('/profile'); }}
              className="bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-3 px-10 rounded-xl transition"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
