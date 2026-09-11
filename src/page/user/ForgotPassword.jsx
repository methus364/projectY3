import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EnvelopeIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import api from '../../lib/api';

// หน้าลืมรหัสผ่าน — wizard 3 สเต็ป (ดีไซน์ตรงกับ mobile app: editregister.js)
//   1) กรอก username อย่างเดียว → POST /auth/send-otp (server หาอีเมลของบัญชีนั้นมาส่ง OTP เอง)
//   2) กรอก OTP 6 หลัก (6 กล่องแยก) → POST /auth/verify-otp (นับถอยหลัง 60 วิ + ส่งใหม่)
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
  const otpRefs = useRef([]);                  // refs ช่อง OTP 6 กล่อง (เลื่อนช่องอัตโนมัติ)

  const [form, setForm] = useState({
    username: '', otp: '', newPassword: '', confirmPassword: '',
  });

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleChange = (field, value) => {
    if (errorMsg) setErrorMsg('');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ===== OTP 6 กล่องแยก (เลื่อนช่องอัตโนมัติ + รองรับวาง) =====
  const handleOtpDigit = (index, value) => {
    if (errorMsg) setErrorMsg('');
    const digits = value.replace(/[^0-9]/g, '');
    setForm((prev) => {
      const arr = (prev.otp || '').padEnd(6, ' ').split('');
      if (digits.length > 1) {
        const pasted = digits.slice(0, 6).split('');
        for (let i = 0; i < 6; i++) arr[i] = pasted[i] || ' ';
        otpRefs.current[Math.min(pasted.length, 5)]?.focus();
      } else {
        arr[index] = digits || ' ';
        if (digits) otpRefs.current[index + 1]?.focus();
      }
      return { ...prev, otp: arr.join('').replace(/ /g, '') };
    });
  };

  const handleOtpKeyPress = (index, e) => {
    if (e.key === 'Backspace') {
      setForm((prev) => {
        const arr = (prev.otp || '').padEnd(6, ' ').split('');
        if (!arr[index] || arr[index] === ' ') {
          if (index > 0) { arr[index - 1] = ' '; otpRefs.current[index - 1]?.focus(); }
        } else {
          arr[index] = ' ';
        }
        return { ...prev, otp: arr.join('').replace(/ /g, '') };
      });
    }
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
    'w-full border-[1.5px] border-[#CBD5E1] rounded-2xl px-4 py-3.5 text-[15px] font-medium text-[#0F172A] bg-[#F7FAFD] transition focus:outline-none focus:border-[#0178C7] focus:bg-[#F0F8FF] focus:ring-2 focus:ring-[#0178C7]/15';
  const actionBtnClass =
    'w-full mt-5 bg-[#0194F3] hover:bg-[#0178C7] text-white font-black py-4 rounded-2xl transition shadow-lg shadow-[#0194F3]/30 active:scale-[0.99] disabled:opacity-70';
  const labelClass = 'block text-[#64748B] text-xs font-extrabold tracking-wide uppercase mb-2 mt-3.5';

  // วงกลมไอคอนหัวการ์ด (แบบเดียวกับแอป)
  const CardIcon = ({ children }) => (
    <div className="w-14 h-14 rounded-full bg-[#E8F4FD] flex items-center justify-center mb-3.5">
      {children}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#EEF3F8]">
      {/* Header ไล่เฉดฟ้า + ปุ่มย้อนกลับ */}
      <div className="bg-gradient-to-br from-[#0A6FC2] via-[#0154A0] to-[#023E7D] px-4 pt-4 pb-8 rounded-b-[32px]">
        <div className="flex items-center justify-between max-w-md mx-auto py-1">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : navigate('/login'))}
            className="w-10 h-10 rounded-full bg-white/18 hover:bg-white/25 flex items-center justify-center text-white transition"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-white text-lg font-black tracking-wide">ลืมรหัสผ่าน</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="px-5 pb-12 -mt-3 max-w-md mx-auto">
        {/* ตัวบอกสเต็ป 3 จุด (ตัวที่ active ขยาย + เงา) */}
        <div className="flex items-center justify-center my-6">
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <span
                className={`rounded-full transition-all ${
                  step >= s
                    ? 'w-3.5 h-3.5 bg-[#0194F3] shadow-md shadow-[#0194F3]/50'
                    : 'w-3 h-3 bg-[#CBD5E1]'
                }`}
              />
              {i < 2 && <span className="w-9 h-[3px] rounded bg-[#CBD5E1] mx-2" />}
            </React.Fragment>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl px-4 py-3 mb-4">
            <ExclamationCircleIcon className="w-5 h-5 text-[#DC2626] shrink-0" />
            <p className="flex-1 text-[#DC2626] text-sm font-bold">{errorMsg}</p>
          </div>
        )}

        {/* สเต็ป 1: กรอก username */}
        {step === 1 && (
          <div className="bg-white rounded-[26px] border border-[#EAEFF5] p-6 shadow-[0_12px_24px_-8px_rgba(30,58,95,0.12)]">
            <CardIcon><EnvelopeIcon className="w-7 h-7 text-[#0194F3]" /></CardIcon>
            <h2 className="text-[#0F172A] text-xl font-black mb-2">กรอกชื่อผู้ใช้เพื่อรับ OTP</h2>
            <p className="text-[#64748B] text-sm font-semibold leading-relaxed">
              ระบบจะส่งรหัส OTP ไปยังอีเมลที่ผูกกับบัญชีนี้
            </p>
            <label className={labelClass}>User Name</label>
            <input value={form.username} onChange={(e) => handleChange('username', e.target.value)}
              placeholder="กรอกชื่อ user" autoCapitalize="none" className={inputClass} />
            <button onClick={handleSendOtp} disabled={sendingOtp} className={actionBtnClass}>
              {sendingOtp ? 'กำลังส่ง...' : 'ส่งรหัส OTP ไปที่อีเมล'}
            </button>
          </div>
        )}

        {/* สเต็ป 2: กรอก OTP (6 กล่องแยก) */}
        {step === 2 && (
          <div className="bg-white rounded-[26px] border border-[#EAEFF5] p-6 shadow-[0_12px_24px_-8px_rgba(30,58,95,0.12)]">
            <CardIcon><ShieldCheckIcon className="w-7 h-7 text-[#0194F3]" /></CardIcon>
            <h2 className="text-[#0F172A] text-xl font-black mb-2">กรอกรหัส OTP</h2>
            {sentTo && (
              <p className="text-[#64748B] text-sm font-semibold mb-2">ส่งรหัส OTP ไปที่ {sentTo} แล้ว</p>
            )}
            <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 mb-4 ${countdown > 0 ? 'bg-[#F1F5F9]' : 'bg-[#FEF2F2]'}`}>
              <ClockIcon className={`w-4 h-4 ${countdown > 0 ? 'text-[#0178C7]' : 'text-[#DC2626]'}`} />
              <span className={`text-xs font-bold ${countdown > 0 ? 'text-[#0178C7]' : 'text-[#DC2626]'}`}>
                {countdown > 0 ? `รหัสจะหมดเวลาใน ${countdown} วินาที` : 'รหัสหมดเวลาแล้ว'}
              </span>
            </div>

            {/* 6 กล่อง OTP */}
            <div className="flex justify-between gap-2">
              {[0, 1, 2, 3, 4, 5].map((i) => {
                const digit = (form.otp || '')[i] || '';
                return (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    value={digit}
                    onChange={(e) => handleOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyPress(i, e)}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                    maxLength={6}
                    className={`w-full aspect-square max-w-[52px] text-center text-2xl font-black rounded-2xl border-[1.5px] transition focus:outline-none ${
                      digit
                        ? 'border-[#0194F3] bg-[#EFF8FF] text-[#0F172A]'
                        : 'border-[#CBD5E1] bg-[#F7FAFD] text-[#0F172A]'
                    } focus:border-[#0178C7] focus:ring-2 focus:ring-[#0178C7]/15`}
                  />
                );
              })}
            </div>

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
          <div className="bg-white rounded-[26px] border border-[#EAEFF5] p-6 shadow-[0_12px_24px_-8px_rgba(30,58,95,0.12)]">
            <CardIcon><LockClosedIcon className="w-7 h-7 text-[#0194F3]" /></CardIcon>
            <h2 className="text-[#0F172A] text-xl font-black mb-2">เปลี่ยนรหัสผ่านใหม่</h2>

            <label className={labelClass}>รหัสผ่านใหม่</label>
            <div className="relative">
              <input value={form.newPassword} onChange={(e) => handleChange('newPassword', e.target.value)}
                type={showNewPassword ? 'text' : 'password'} placeholder="กรอกรหัสผ่านใหม่"
                className={inputClass + ' pr-12'} />
              <button type="button" onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0178C7]">
                {showNewPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            <label className={labelClass}>ยืนยันรหัสผ่านใหม่</label>
            <div className="relative">
              <input value={form.confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)}
                type={showConfirmPassword ? 'text' : 'password'} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                className={inputClass + ' pr-12'} />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0178C7]">
                {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
              </button>
            </div>

            {form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword && (
              <p className="text-[#DC2626] text-sm font-bold mt-2">รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>
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
