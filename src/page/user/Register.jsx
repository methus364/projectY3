import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AuthLayout, TextField, PasswordField, RoleSelector, FormMessage, SubmitButton } from '../../components/user/AuthUI';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    user_role: '', // ต้องเลือกประเภทผู้เช่าก่อนสมัคร (รายวัน/รายเดือน)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    // validate เบื้องต้นฝั่ง client (ความถูกต้องจริงเชื่อ backend)
    if (form.password !== form.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (!form.user_role) {
      setError('กรุณาเลือกประเภทสมาชิก (รายวัน หรือ รายเดือน)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/register', {
        username: form.username,
        password: form.password,
        full_name: form.full_name,
        email: form.email,
        phone_number: form.phone_number || undefined,
        user_role: form.user_role,
      });
      // สมัครแล้วต้องยืนยัน OTP ก่อน — พาไปหน้ายืนยันพร้อมเติมอีเมลให้
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      setError(err.response?.data?.message || 'สมัครสมาชิกไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon="🏠" tagline="สมัครสมาชิกใหม่" title="สร้างบัญชีใหม่">
      <form onSubmit={handleRegister} className="space-y-4">
        <TextField
          label="ชื่อผู้ใช้ (Username)" name="username" required
          value={form.username} onChange={handleChange} placeholder="ใช้แสดงในระบบ"
        />
        <TextField
          label="ชื่อ-นามสกุล" name="full_name" required
          value={form.full_name} onChange={handleChange} placeholder="ชื่อจริงของคุณ"
        />
        <TextField
          label="อีเมล" name="email" type="email" required
          value={form.email} onChange={handleChange} placeholder="you@example.com"
        />
        <TextField
          label="เบอร์โทรศัพท์" name="phone_number" type="tel"
          value={form.phone_number} onChange={handleChange} placeholder="08x-xxx-xxxx"
        />
        <PasswordField
          label="รหัสผ่าน" name="password" required
          value={form.password} onChange={handleChange} placeholder="อย่างน้อย 6 ตัวอักษร"
        />
        <PasswordField
          label="ยืนยันรหัสผ่าน" name="confirmPassword" required
          value={form.confirmPassword} onChange={handleChange} placeholder="********"
        />

        <RoleSelector value={form.user_role} onChange={(v) => setForm({ ...form, user_role: v })} />

        <FormMessage error={error} />

        <SubmitButton loading={loading} loadingText="กำลังสมัคร...">สมัครสมาชิก</SubmitButton>
      </form>

      <p className="mt-6 text-sm text-center text-[#64748B]">
        มีบัญชีอยู่แล้ว?{' '}
        <Link to="/login" className="text-[#5A2D82] font-bold hover:underline">เข้าสู่ระบบ</Link>
      </p>
    </AuthLayout>
  );
}
