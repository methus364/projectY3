import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

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
      const res = await axios.post(`${API}/login`, { username, password });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // เข้าสู่ระบบด้วย Social (Google / Facebook / LINE)
  // หมายเหตุ: production ต้องต่อ SDK ของแต่ละ provider ให้คืน provider_id/email/name
  //   ตอนนี้ยังไม่ได้ตั้งค่า OAuth จึงใช้การกรอกข้อมูลทดสอบ (prompt) เพื่อเดโม flow auto-link/register
  const handleSocial = async (provider) => {
    setError('');
    const providerId = window.prompt(`[ทดสอบ ${provider}] กรอกรหัสบัญชี (provider_id):`);
    if (!providerId) return; // ยกเลิก
    const email = window.prompt('อีเมล (เว้นว่างได้ — ใช้ผูกกับสมาชิกเดิมถ้าตรง):') || undefined;
    const fullName = window.prompt('ชื่อ-นามสกุล (เว้นว่างได้):') || undefined;

    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/social`, {
        provider,
        provider_id: providerId,
        email,
        full_name: fullName,
      });
      saveSessionAndRedirect(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าสู่ระบบด้วย social ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  // ปุ่ม social: provider key + ป้าย + สี
  const socialButtons = [
    { provider: 'google', label: 'Google', style: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50' },
    { provider: 'facebook', label: 'Facebook', style: 'bg-blue-600 text-white hover:bg-blue-700' },
    { provider: 'line', label: 'LINE', style: 'bg-green-500 text-white hover:bg-green-600' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          เข้าสู่ระบบ
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">
              ชื่อผู้ใช้
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:text-white"
              placeholder="กรอกชื่อผู้ใช้"
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:text-white"
              placeholder="********"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        {/* ตัวคั่น + ปุ่มเข้าสู่ระบบด้วย social */}
        <div className="flex items-center my-5">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
          <span className="px-3 text-sm text-gray-400">หรือเข้าสู่ระบบด้วย</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
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

        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          ยังไม่มีบัญชี?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline">
            สมัครสมาชิก
          </Link>
        </p>
        <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">
          <Link to="/" className="text-indigo-500 hover:underline">
            ← กลับหน้าแรก
          </Link>
        </p>
      </div>
    </div>
  );
}
