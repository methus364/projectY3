import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

// หน้าปลายทางหลัง LINE login → รับ code มาแลกเป็น JWT ผ่าน backend
export default function LineCallback() {
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

        api.post('/auth/line/exchange', { code, redirect_uri: redirectUri })
            .then((res) => {
                const { token, payload, isNewUser } = res.data;
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(payload));
                // ผู้ใช้ใหม่ → ให้เลือกประเภทสมาชิกก่อน · ผู้ใช้เดิม → เข้าตาม role ได้เลย
                if (isNewUser) return navigate('/complete-profile');
                navigate(payload.role === 'Admin' ? '/admin' : '/');
            })
            .catch((err) => {
                setError(err.response?.data?.message || 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ');
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
                    <p className="text-foreground">กำลังเข้าสู่ระบบด้วย LINE...</p>
                )}
            </div>
        </div>
    );
}
