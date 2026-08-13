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
  const navigate = useNavigate();

  // เก็บ token + ข้อมูลผู้ใช้ แล้วพาไปหน้าตาม role (ใช้ร่วมทั้ง login ปกติ + social)
  const saveSessionAndRedirect = ({ token, payload }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));
    navigate(payload.role === 'Admin' ? '/admin' : '/');
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
          <Link to="/register" className="text-[#5A2D82] font-bold hover:underline">สมัครสมาชิก</Link>
        </p>
        <p className="text-sm">
          <Link to="/" className="text-[#94A3B8] hover:text-[#5A2D82]">← กลับหน้าแรก</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
