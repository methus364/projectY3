import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setLoading(true);
    try {
      await api.post('/register', {
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        email: form.email || undefined,
        phone_number: form.phone_number || undefined,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'username',        label: 'ชื่อผู้ใช้ (Username) *', type: 'text',     placeholder: 'ใช้สำหรับเข้าสู่ระบบ', required: true },
    { name: 'full_name',       label: 'ชื่อ-นามสกุล *',          type: 'text',     placeholder: 'ชื่อจริงของคุณ',        required: true },
    { name: 'email',           label: 'อีเมล',                    type: 'email',    placeholder: 'you@example.com',        required: false },
    { name: 'phone_number',    label: 'เบอร์โทรศัพท์',            type: 'tel',      placeholder: '08x-xxx-xxxx',           required: false },
    { name: 'password',        label: 'รหัสผ่าน *',               type: 'password', placeholder: '********',               required: true },
    { name: 'confirmPassword', label: 'ยืนยันรหัสผ่าน *',         type: 'password', placeholder: '********',               required: true },
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">

      {/* Header สีฟ้า */}
      <div className="bg-[#5A2D82] pt-14 pb-16 px-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-white text-2xl font-black">Around Loei</h1>
        <p className="text-white/80 text-sm font-semibold mt-1">สมัครสมาชิกใหม่</p>
      </div>

      {/* White card */}
      <div className="bg-white rounded-t-[40px] -mt-8 flex-1 px-6 pt-8 pb-10 max-w-md w-full mx-auto shadow-lg">
        <h2 className="text-[#1E293B] text-xl font-black mb-6">สร้างบัญชีใหม่</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-2xl px-4 py-3 mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {fields.map(({ name, label, type, placeholder, required }) => (
            <div key={name}>
              <label className="block text-[#334155] text-sm font-bold mb-2">
                {label} {required && <span className="text-red-400">*</span>}
              </label>
              <input
                type={type}
                name={name}
                required={required}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition text-base mt-2"
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-6 text-sm text-center text-[#64748B]">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-[#5A2D82] font-bold hover:underline">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}
