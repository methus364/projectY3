import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

// หน้าปลายทางหลัง LINE login → รับ code มาแลกเป็น JWT ผ่าน backend
export default function LineCallback() {
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const savedState = sessionStorage.getItem('line_state');

        // ตรวจ state กัน CSRF
        if (!code) {
            setError('ไม่ได้รับ code จาก LINE');
            return;
        }
        if (!state || state !== savedState) {
            setError('state ไม่ตรง (อาจถูกปลอมแปลง) กรุณาลองใหม่');
            return;
        }
        sessionStorage.removeItem('line_state');

        // redirect_uri ต้องตรงกับตอนเริ่ม login เป๊ะ
        const redirectUri = `${window.location.origin}/auth/line/callback`;

        axios.post(`${API}/auth/line/exchange`, { code, redirect_uri: redirectUri })
            .then((res) => {
                const { token, payload } = res.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(payload));
                navigate(payload.role === 'Admin' ? '/admin' : '/');
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ');
            });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
            <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
                {error ? (
                    <>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button onClick={() => navigate('/login')} className="text-indigo-600 hover:underline">
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </button>
                    </>
                ) : (
                    <p className="text-gray-700">กำลังเข้าสู่ระบบด้วย LINE...</p>
                )}
            </div>
        </div>
    );
}
