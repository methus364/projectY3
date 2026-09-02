import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

// หน้าลืมรหัสผ่าน — wizard 3 สเต็ป (อ้างอิง mobile app: editregister.js)
//   1) กรอก username อย่างเดียว → POST /auth/send-otp (server หาอีเมลของบัญชีนั้นมาส่ง OTP เอง)
//   2) กรอก OTP 6 หลัก → POST /auth/verify-otp (มีนับถอยหลัง 60 วิ + ส่งใหม่)
//   3) ตั้งรหัสผ่านใหม่ → POST /auth/reset-password → กลับไปหน้า login
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const timerRef = useRef(null);
  const [sentTo, setSentTo] = useState('');   // อีเมล (ปิดบังบางส่วน) ที่ระบบส่ง OTP ไป

  const [form, setForm] = useState({
    username: '', otp: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleChange = (field, value) => {
    if (errorMsg) setErrorMsg('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); timerRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setErrorMsg('');
    if (!form.username.trim()) {
      setErrorMsg('กรุณากรอกชื่อ user');
      return;
    }
    try {
      setSendingOtp(true);
      const res = await api.post('/auth/send-otp', {
        username: form.username.trim(),
      });
      if (!res.data?.success) { setErrorMsg(res.data?.message || 'ไม่สามารถส่งรหัส OTP ได้'); return; }
      setSentTo(res.data?.email || '');   // เก็บอีเมลปิดบังไว้แสดงในสเต็ป 2
      startTimer();
      setStep(2);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'ไม่พบข้อมูลผู้ใช้ หรือส่งรหัส OTP ไม่สำเร็จ');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setErrorMsg('');
    if (!form.otp.trim()) { setErrorMsg('กรุณากรอกรหัส OTP'); return; }
    if (countdown === 0) { setErrorMsg('รหัส OTP หมดเวลาแล้ว กรุณาขอรหัสใหม่'); return; }
    try {
      setVerifyingOtp(true);
      const res = await api.post('/auth/verify-otp', {
        username: form.username.trim(), otp: form.otp.trim(),
      });
      if (!res.data?.success) { setErrorMsg(res.data?.message || 'กรุณากรอกรหัส OTP ให้ถูกต้อง'); return; }
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
      setStep(3);
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'ไม่สามารถตรวจสอบ OTP ได้');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSavePassword = async () => {
    setErrorMsg('');
    if (!form.newPassword.trim() || !form.confirmPassword.trim()) { setErrorMsg('กรุณากรอกรหัสผ่านให้ครบ'); return; }
    if (form.newPassword.length < 6) { setErrorMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return; }
    if (form.newPassword !== form.confirmPassword) { setErrorMsg('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    try {
      setSavingPassword(true);
      const res = await api.post('/auth/reset-password', {
        username: form.username.trim(), newPassword: form.newPassword,
      });
      if (!res.data?.success) { setErrorMsg(res.data?.message || 'ไม่สามารถบันทึกรหัสผ่านได้'); return; }
      alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว');
      navigate('/login');
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'ไม่สามารถบันทึกรหัสผ่านได้');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setForm((prev) => ({ ...prev, otp: '' }));
    await handleSendOtp();
  };

  const inputClass =
    'w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20';
  const actionBtnClass =
    'w-full mt-4 bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-4 rounded-2xl transition disabled:opacity-70';

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header ฟ้า + ปุ่มย้อนกลับ */}
      <div className="bg-[#0178C7] px-4 py-3.5 flex items-center justify-between">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate('/login'))}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-white"
        >
          ←
        </button>
        <h1 className="text-white text-lg font-black">ลืมรหัสผ่าน</h1>
        <div className="w-9" />
      </div>

      <div className="p-5 pb-10 max-w-md mx-auto">
        {/* ตัวบอกสเต็ป 3 จุด */}
        <div className="flex items-center justify-center mb-5">
          <span className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-[#0194F3]' : 'bg-[#CBD5E1]'}`} />
          <span className="w-9 h-0.5 bg-[#CBD5E1] mx-2" />
          <span className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-[#0194F3]' : 'bg-[#CBD5E1]'}`} />
          <span className="w-9 h-0.5 bg-[#CBD5E1] mx-2" />
          <span className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-[#0194F3]' : 'bg-[#CBD5E1]'}`} />
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl px-4 py-3 mb-4">
            <span className="text-[#DC2626]">⚠️</span>
            <p className="flex-1 text-[#DC2626] text-sm font-bold">{errorMsg}</p>
          </div>
        )}

        {/* สเต็ป 1: กรอก user + email */}
        {step === 1 && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5">
            <p className="text-[#0194F3] text-lg font-black mb-2">กรอกชื่อผู้ใช้เพื่อรับ OTP</p>
            <p className="text-[#64748B] text-sm font-semibold mb-3.5">
              ระบบจะส่งรหัส OTP ไปยังอีเมลที่ผูกกับบัญชีนี้
            </p>
            <label className="block text-[#334155] text-sm font-bold mb-2 mt-2.5">User Name</label>
            <input value={form.username} onChange={(e) => handleChange('username', e.target.value)}
              placeholder="กรอกชื่อ user" autoCapitalize="none" className={inputClass} />
            <button onClick={handleSendOtp} disabled={sendingOtp} className={actionBtnClass}>
              {sendingOtp ? 'กำลังส่ง...' : 'ส่งรหัส OTP ไปที่อีเมล'}
            </button>
          </div>
        )}

        {/* สเต็ป 2: กรอก OTP */}
        {step === 2 && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5">
            <p className="text-[#0194F3] text-lg font-black mb-2">กรอกรหัส OTP</p>
            {sentTo && (
              <p className="text-[#64748B] text-sm font-semibold mb-1">ส่งรหัสไปที่อีเมล {sentTo}</p>
            )}
            <p className="text-[#64748B] text-sm font-semibold mb-3.5">รหัสจะหมดเวลาใน {countdown} วินาที</p>
            <input value={form.otp}
              onChange={(e) => handleChange('otp', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric" maxLength={6} placeholder="กรอกรหัส OTP 6 หลัก"
              className={inputClass + ' text-center tracking-[0.4em] text-lg font-bold'} />
            <button onClick={handleVerifyOtp} disabled={verifyingOtp} className={actionBtnClass}>
              {verifyingOtp ? 'กำลังยืนยัน...' : 'ยืนยัน OTP'}
            </button>
            <button onClick={handleResendOtp} disabled={countdown > 0}
              className={`w-full mt-3 py-2.5 text-[#0178C7] font-bold text-sm ${countdown > 0 ? 'opacity-50' : 'hover:underline'}`}>
              {countdown > 0 ? `ส่งใหม่ได้ใน ${countdown} วินาที` : 'ส่งรหัส OTP ใหม่'}
            </button>
          </div>
        )}

        {/* สเต็ป 3: ตั้งรหัสผ่านใหม่ */}
        {step === 3 && (
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5">
            <p className="text-[#0194F3] text-lg font-black mb-2">เปลี่ยนรหัสผ่านใหม่</p>

            <label className="block text-[#334155] text-sm font-bold mb-2 mt-2.5">รหัสผ่านใหม่</label>
            <div className="relative">
              <input value={form.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)}
                type={showNewPassword ? 'text' : 'password'} placeholder="กรอกรหัสผ่านใหม่"
                className={inputClass + ' pr-12'} />
              <button type="button" onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>

            <label className="block text-[#334155] text-sm font-bold mb-2 mt-2.5">ยืนยันรหัสผ่านใหม่</label>
            <div className="relative">
              <input value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)}
                type={showConfirmPassword ? 'text' : 'password'} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className={inputClass + ' pr-12'} />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-lg">
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>

            {form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword && (
              <p className="text-[#DC2626] text-sm font-bold mt-2">กรุณาพิมพ์ตัวเลขให้ตรงกัน</p>
            )}

            <button onClick={handleSavePassword} disabled={savingPassword} className={actionBtnClass}>
              {savingPassword ? 'กำลังบันทึก...' : 'ยืนยัน'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
