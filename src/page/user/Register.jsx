import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

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
      await axios.post(`${API}/register`, {
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
    { name: 'username',        label: 'ชื่อผู้ใช้ (Username) *', type: 'text',     placeholder: 'ใช้สำหรับเข้าสู่ระบบ',  required: true },
    { name: 'full_name',       label: 'ชื่อ-นามสกุล *',          type: 'text',     placeholder: 'ชื่อจริงของคุณ',         required: true },
    { name: 'email',           label: 'อีเมล',                    type: 'email',    placeholder: 'you@example.com',         required: false },
    { name: 'phone_number',    label: 'เบอร์โทรศัพท์',            type: 'tel',      placeholder: '08x-xxx-xxxx',            required: false },
    { name: 'password',        label: 'รหัสผ่าน *',               type: 'password', placeholder: '********',                required: true },
    { name: 'confirmPassword', label: 'ยืนยันรหัสผ่าน *',         type: 'password', placeholder: '********',                required: true },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
          สมัครสมาชิก
        </h2>

        {error && (
          <div className="text-red-600 bg-red-100 border border-red-300 px-3 py-2 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {fields.map(({ name, label, type, placeholder, required }) => (
            <div key={name}>
              <label className="block text-gray-700 dark:text-gray-200 mb-1 text-sm">
                {label}
              </label>
              <input
                type={type}
                name={name}
                required={required}
                value={form[name]}
                onChange={handleChange}
                placeholder={placeholder}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 outline-none dark:bg-gray-800 dark:text-white"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
          >
            {loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}
          </button>
        </form>

        <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
          มีบัญชีอยู่แล้ว?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
