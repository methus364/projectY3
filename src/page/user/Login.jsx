import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { isConfigured, startGoogleLogin, startLineLogin } from '../../lib/socialAuth';
import { AuthLayout, TextField, PasswordField, FormMessage, SubmitButton } from '../../components/user/AuthUI';

export default function Login() {
  const [loginId, setLoginId] = useState(''); // อีเมลหรือชื่อผู้ใช้ก็ได้
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [redirectTo, setRedirectTo] = useState('/');
  const navigate = useNavigate();

  // เก็บ token + ข้อมูลผู้ใช้ แล้วโชว์หน้า "เข้าสู่ระบบสำเร็จ" ก่อนพาไปตาม role
  const saveSessionAndRedirect = ({ token, payload }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));
    setRedirectTo(payload.role === 'Admin' ? '/admin' : '/');
    setSuccessVisible(true);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/login', { login: loginId, password });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      // ยังไม่ยืนยันอีเมล (403) → พาไปหน้ายืนยัน OTP
      // เติมให้เฉพาะกรณีกรอกมาเป็นอีเมล (ถ้ากรอก username จะให้ผู้ใช้พิมพ์อีเมลเองที่หน้ายืนยัน)
      if (err.response?.status === 403 && err.response?.data?.needVerification) {
        navigate('/verify-email', { state: { email: loginId.includes('@') ? loginId : '' } });
        return;
      }
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // เข้าสู่ระบบด้วย LINE — redirect ไปหน้า login ของ LINE
  const handleLine = () => {
    setError('');
    if (!isConfigured('line')) {
      setError('ยังไม่ได้ตั้งค่า LINE (ดูวิธีใน docs/SOCIAL_LOGIN_SETUP.md)');
      return;
    }
    startLineLogin();
  };

  // เข้าสู่ระบบด้วย Google — redirect ไปหน้า login ของ Google (redirect flow เหมือน LINE)
  const handleGoogle = () => {
    setError('');
    if (!isConfigured('google')) {
      setError('ยังไม่ได้ตั้งค่า Google (ดูวิธีใน docs/SOCIAL_LOGIN_SETUP.md)');
      return;
    }
    startGoogleLogin();
  };

  // หน้า/โมดัล "เข้าสู่ระบบสำเร็จ" — ไอคอนเช็คขยับได้ + ปุ่มตกลงเพื่อไปหน้าแรก
  if (successVisible) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0a1626]/60 backdrop-blur-sm success-overlay">
        <div className="success-card w-full max-w-sm rounded-[28px] bg-white shadow-2xl px-8 py-10 text-center">
          {/* ไอคอนเช็คมาร์คขยับได้ */}
          <div className="success-badge mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#DCFCE7]">
            <svg viewBox="0 0 52 52" className="h-14 w-14">
              <circle cx="26" cy="26" r="24" fill="none" stroke="#16A34A" strokeWidth="3" opacity="0.25" />
              <path
                className="success-check-path"
                fill="none"
                stroke="#16A34A"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 27 l7 7 l15 -16"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-black text-[#0F172A]">เข้าสู่ระบบสำเร็จ</h2>
          <p className="mt-2 text-sm font-medium text-[#64748B]">
            ยินดีต้อนรับกลับมา! กดตกลงเพื่อไปยังหน้าแรก
          </p>

          <button
            onClick={() => navigate(redirectTo)}
            className="mt-8 w-full rounded-2xl bg-[#0178C7] py-3.5 font-bold text-white shadow-lg shadow-[#0178C7]/30 transition hover:bg-[#0164A6] active:scale-[0.98]"
          >
            ตกลง
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout icon="🏠" tagline="หอพักจังหวัดเลย" title="เข้าสู่ระบบ">
      <form onSubmit={handleLogin} className="space-y-4">
        <TextField
          label="อีเมล หรือ ชื่อผู้ใช้"
          type="text"
          required
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="อีเมล หรือ ชื่อผู้ใช้"
        />

        <PasswordField
          label="รหัสผ่าน"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="รหัสผ่าน"
        />

        <div className="flex justify-end -mt-1">
          <Link to="/forgot-password" className="text-[#0178C7] text-sm font-bold hover:underline">ลืมรหัสผ่าน?</Link>
        </div>

        <FormMessage error={error} />

        <SubmitButton loading={loading} loadingText="กำลังเข้าสู่ระบบ...">เข้าสู่ระบบ</SubmitButton>
      </form>

      {/* ตัวคั่น */}
      <div className="flex items-center my-5">
        <div className="flex-grow border-t border-[#E2E8F0]"></div>
        <span className="px-3 text-xs text-[#94A3B8] font-semibold">หรือเข้าสู่ระบบด้วย</span>
        <div className="flex-grow border-t border-[#E2E8F0]"></div>
      </div>

      {/* Social buttons */}
      <div className="space-y-3">
        <button
          type="button"
          disabled={loading}
          onClick={handleLine}
          className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:opacity-90 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
        >
          <span>💬</span> เข้าสู่ระบบด้วย LINE
        </button>

        {/* ปุ่ม Google — redirect ไปหน้า login ของ Google (เหมือน LINE) */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogle}
          className="w-full flex items-center justify-center gap-3 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155] font-bold py-3 rounded-2xl transition disabled:opacity-50"
        >
          <span>🔍</span> เข้าสู่ระบบด้วย Google
        </button>
      </div>

      <div className="mt-6 text-center space-y-2">
        <p className="text-sm text-[#64748B]">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-[#0178C7] font-bold hover:underline">สมัครสมาชิก</Link>
        </p>
        <p className="text-sm">
          <Link to="/" className="text-[#94A3B8] hover:text-[#0178C7]">← กลับหน้าแรก</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
