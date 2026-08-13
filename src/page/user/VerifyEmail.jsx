import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';
import { AuthLayout, TextField, FormMessage, SubmitButton } from '../../components/user/AuthUI';

// หน้ายืนยันอีเมลด้วย OTP หลังสมัคร — ยืนยันสำเร็จแล้วระบบ login ให้เลย (คืน token)
export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  // อีเมลถูกส่งมาจากหน้าสมัคร/login (state) — ถ้าไม่มีให้ผู้ใช้กรอกเอง
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // ยืนยันสำเร็จ → เก็บ session แล้วพาไปหน้าตาม role
  const saveSessionAndRedirect = ({ token, payload }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));
    navigate(payload.role === 'Admin' ? '/admin' : '/');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-registration', { email, otp });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'ยืนยันไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // ขอส่งรหัส OTP ใหม่ (กรณีไม่ได้รับ/หมดอายุ)
  const handleResend = async () => {
    setError('');
    setInfo('');
    if (!email) {
      setError('กรุณากรอกอีเมลก่อนขอรหัสใหม่');
      return;
    }
    setResending(true);
    try {
      const res = await api.post('/auth/resend-registration-otp', { email });
      setInfo(res.data?.message || 'ส่งรหัส OTP ใหม่ให้แล้ว');
    } catch (err) {
      setError(err.response?.data?.message || 'ส่งรหัสใหม่ไม่สำเร็จ');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout icon="✉️" tagline="ยืนยันอีเมล" title="กรอกรหัส OTP">
      <p className="text-sm text-[#64748B] -mt-4 mb-6">
        เราได้ส่งรหัส 6 หลักไปที่อีเมลของคุณแล้ว (รหัสมีอายุ 5 นาที)
      </p>

      <form onSubmit={handleVerify} className="space-y-4">
        <TextField
          label="อีเมล" type="email" required
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
        />

        <div>
          <label className="block text-[#334155] text-sm font-bold mb-2">รหัส OTP</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="______"
            className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-center text-lg tracking-[0.5em] font-bold text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
          />
        </div>

        <FormMessage error={error} info={info} />

        <SubmitButton loading={loading} loadingText="กำลังยืนยัน...">ยืนยันอีเมล</SubmitButton>
      </form>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-[#64748B]">
          ไม่ได้รับรหัส?{' '}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="text-[#5A2D82] font-bold hover:underline disabled:opacity-50"
          >
            {resending ? 'กำลังส่ง...' : 'ส่งรหัสใหม่'}
          </button>
        </p>
        <p className="text-sm">
          <Link to="/login" className="text-[#94A3B8] hover:text-[#5A2D82]">← กลับไปเข้าสู่ระบบ</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
