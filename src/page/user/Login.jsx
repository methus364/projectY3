import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { isConfigured, getGoogleIdToken, getFacebookAccessToken, startLineLogin } from '../../lib/socialAuth';

export default function Login() {
  const [username, setUsername] = useState('');
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
      const res = await api.post('/login', { username, password });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // เข้าสู่ระบบด้วย Social — ดึง token จาก SDK แล้วส่ง backend ตรวจ
  const handleSocial = async (provider) => {
    setError('');
    if (!isConfigured(provider)) {
      setError(`ยังไม่ได้ตั้งค่า ${provider} (ดูวิธีใน docs/SOCIAL_LOGIN_SETUP.md)`);
      return;
    }
    try {
      if (provider === 'line') { startLineLogin(); return; }
      setLoading(true);
      const token = provider === 'google'
        ? await getGoogleIdToken()
        : await getFacebookAccessToken();
      const res = await api.post('/auth/social', { provider, token });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'เข้าสู่ระบบด้วย social ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">

      {/* Header สีฟ้า */}
      <div className="bg-[#5A2D82] pt-14 pb-16 px-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-3xl">🏠</span>
        </div>
        <h1 className="text-white text-2xl font-black">Around Loei</h1>
        <p className="text-white/80 text-sm font-semibold mt-1">หอพักจังหวัดเลย</p>
      </div>

      {/* White card */}
      <div className="bg-white rounded-t-[40px] -mt-8 flex-1 px-6 pt-8 pb-10 max-w-md w-full mx-auto shadow-lg">
        <h2 className="text-[#1E293B] text-xl font-black mb-6">เข้าสู่ระบบ</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[#334155] text-sm font-bold mb-2">ชื่อผู้ใช้</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้"
              className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
            />
          </div>

          <div>
            <label className="block text-[#334155] text-sm font-bold mb-2">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="รหัสผ่าน"
              className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-semibold text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D32F2F] hover:bg-[#B71C1C] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition text-base mt-2"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
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
            onClick={() => handleSocial('line')}
            className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:opacity-90 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
          >
            <span>💬</span> เข้าสู่ระบบด้วย LINE
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSocial('google')}
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
      </div>
    </div>
  );
}
