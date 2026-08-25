import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

// หน้าปลายทางหลัง Google login → รับ code มาแลกเป็น JWT ผ่าน backend
export default function GoogleCallback() {
    const [error, setError] = useState('');
    const navigate = useNavigate();
    // กัน useEffect รันซ้ำ (React StrictMode รัน 2 รอบตอน dev) — OAuth code ใช้ได้ครั้งเดียว
    // และ state ใน sessionStorage ถูกลบหลังใช้ ถ้ารันซ้ำจะเช็ค state ไม่ผ่าน
    const exchanged = useRef(false);

    useEffect(() => {
        if (exchanged.current) return;
        exchanged.current = true;

        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const savedState = sessionStorage.getItem('google_state');

        // ตรวจ state กัน CSRF
        if (!code) {
            setError('ไม่ได้รับ code จาก Google');
            return;
        }
        if (!state || state !== savedState) {
            setError('state ไม่ตรง (อาจถูกปลอมแปลง) กรุณาลองใหม่');
            return;
        }
        sessionStorage.removeItem('google_state');

        // redirect_uri ต้องตรงกับตอนเริ่ม login เป๊ะ
        const redirectUri = `${window.location.origin}/auth/google/callback`;

        api.post('/auth/google/exchange', { code, redirect_uri: redirectUri })
            .then((res) => {
                const { token, payload, isNewUser, profile } = res.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(payload));
                // ผู้ใช้ใหม่ → เก็บชื่อจาก Google ไว้ prefill หน้า complete-profile แล้วไปกรอกข้อมูล
                if (isNewUser) {
                    if (profile) localStorage.setItem('social_profile', JSON.stringify(profile));
                    return navigate('/complete-profile');
                }
                // ผู้ใช้เดิม → เข้าตาม role ได้เลย
                navigate(payload.role === 'Admin' ? '/admin' : '/');
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ');
            });
    }, [navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="bg-card shadow-xl rounded-2xl p-8 w-full max-w-md text-center">
                {error ? (
                    <>
                        <p className="text-red-500 mb-4">{error}</p>
                        <button onClick={() => navigate('/login')} className="text-primary hover:underline">
                            ← กลับไปหน้าเข้าสู่ระบบ
                        </button>
                    </>
                ) : (
                    <p className="text-foreground">กำลังเข้าสู่ระบบด้วย Google...</p>
                )}
            </div>
        </div>
    );
}
