import React from 'react';

// หน้า/โมดัลผลลัพธ์สำเร็จของ flow auth (เข้าสู่ระบบ / สมัครสมาชิก)
// ไอคอนเช็คมาร์คขยับได้ (วาดเส้น + วงแหวนเต้น) + ปุ่มยืนยัน
// props: title, subtitle, buttonText, onOk
export default function AuthSuccessScreen({
  title = 'สำเร็จ',
  subtitle = '',
  buttonText = 'ตกลง',
  onOk,
}) {
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

        <h2 className="text-2xl font-black text-[#0F172A]">{title}</h2>
        {subtitle ? (
          <p className="mt-2 text-sm font-medium text-[#64748B]">{subtitle}</p>
        ) : null}

        <button
          onClick={onOk}
          className="mt-8 w-full rounded-2xl bg-[#0178C7] py-3.5 font-bold text-white shadow-lg shadow-[#0178C7]/30 transition hover:bg-[#0164A6] active:scale-[0.98]"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
