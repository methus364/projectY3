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

  const socialButtons = [
    { provider: 'google',   label: 'Google',   style: 'bg-card text-foreground border border-border hover:bg-muted' },
    { provider: 'facebook', label: 'Facebook', style: 'bg-blue-600 text-white hover:bg-blue-700' },
    { provider: 'line',     label: 'LINE',     style: 'bg-green-500 text-white hover:bg-green-600' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="bg-card shadow-xl rounded-2xl p-8 w-full max-w-md border border-border">
        <h2 className="text-3xl font-bold text-center text-foreground mb-6">เข้าสู่ระบบ</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-foreground mb-1">ชื่อผู้ใช้</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              placeholder="กรอกชื่อผู้ใช้"
            />
          </div>

          <div>
            <label className="block text-foreground mb-1">รหัสผ่าน</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
              placeholder="********"
            />
          </div>

          {error && <p className="text-sm text-destructive text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* ตัวคั่น + ปุ่ม social */}
        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-border"></div>
          <span className="px-3 text-sm text-muted-foreground">หรือเข้าสู่ระบบด้วย</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <div className="space-y-2">
          {socialButtons.map((b) => (
            <button
              key={b.provider}
              type="button"
              disabled={loading}
              onClick={() => handleSocial(b.provider)}
              className={`w-full font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 ${b.style}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-center text-muted-foreground">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-primary hover:underline">สมัครสมาชิก</Link>
        </p>
        <p className="mt-2 text-sm text-center text-muted-foreground">
          <Link to="/" className="text-primary hover:underline">← กลับหน้าแรก</Link>
        </p>
      </div>
    </div>
  );
}
