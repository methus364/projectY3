import React, { useState } from 'react';

// ============================================================
// ชุด UI กลางของหน้า auth (Login / Register / VerifyEmail / CompleteProfile)
// รวมดีไซน์ไว้ที่เดียว ให้ทุกหน้าหน้าตาเป็นระบบเดียวกัน + แก้ธีมที่เดียวจบ
// ============================================================

// โครงหน้า auth (ดีไซน์แบบ mobile app): รูปตึกจริงเต็มจอ + การ์ดฟอร์มกระจกฝ้าลอยตรงกลาง
const SERIF = 'Georgia, "Times New Roman", serif';

export function AuthLayout({ icon, tagline, title, children }) {
  return (
    <div className="relative min-h-screen bg-[#0B1F33] flex flex-col">
      {/* รูปตึกจริง (จากแอพ) เป็นพื้นหลังเต็มจอ + ไล่เฉดทับให้อ่านง่าย */}
      <img src="/hero-around-loei.jpg" alt="" className="fixed inset-0 w-full h-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061424]/40 via-[#061424]/25 to-[#040e1a]/85" />

      {/* เนื้อหา (ลอยเหนือรูป) */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[30px] border border-white/70 bg-white/85 backdrop-blur-xl shadow-2xl shadow-[#0a2540]/40 px-6 sm:px-9 py-8">
          {/* หัวการ์ด: ไอคอน + แบรนด์ */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-[72px] h-[72px] rounded-[22px] bg-[#0194F3] flex items-center justify-center shadow-lg shadow-[#0194F3]/40">
              <span className="text-3xl">{icon}</span>
            </div>
            <h1 className="text-[#14304C] text-3xl font-bold mt-3.5" style={{ fontFamily: SERIF }}>Around Loei</h1>
            <p className="text-[#6B7B8C] text-sm font-semibold mt-1">{tagline}</p>
          </div>

          {title && <h2 className="text-[#1E293B] text-xl font-black mb-6 text-center">{title}</h2>}
          {children}
        </div>

        {/* ป้ายตำแหน่ง (กระจกฝ้า) ใต้การ์ด */}
        <div className="mt-5 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur px-3.5 py-1.5">
          <span className="text-sm">📍</span>
          <span className="text-[#EAF6FF] text-xs font-semibold">อ.เมือง จ.เลย</span>
        </div>
      </div>
    </div>
  );
}

// คลาส input มาตรฐาน (ใช้ซ้ำทุกช่อง)
const inputClass =
  'w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] ' +
  'focus:outline-none focus:border-[#0194F3] focus:ring-2 focus:ring-[#0194F3]/20';

// ป้ายกำกับช่องกรอก (มีดอกจันแดงถ้า required)
function FieldLabel({ label, required }) {
  return (
    <label className="block text-[#334155] text-sm font-bold mb-2">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
  );
}

// ช่องกรอกข้อความทั่วไป
export function TextField({ label, required, ...props }) {
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <input required={required} className={inputClass} {...props} />
    </div>
  );
}

// ช่องรหัสผ่าน — มีปุ่มสลับแสดง/ซ่อน
export function PasswordField({ label, required, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required={required}
          className={inputClass + ' pr-12'}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-lg"
          aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        >
          {show ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}

// ตัวเลือกประเภทสมาชิก (รายวัน/รายเดือน) — ใช้ทั้งหน้าสมัคร + หน้าเติมข้อมูล social
export function RoleSelector({ value, onChange }) {
  const options = [
    { value: 'Daily_Tenant',   label: 'ผู้เช่ารายวัน',   desc: 'จองห้องพักแบบรายวัน' },
    { value: 'Monthly_Tenant', label: 'ผู้เช่ารายเดือน', desc: 'เช่าอยู่ประจำแบบรายเดือน' },
  ];
  return (
    <div>
      <FieldLabel label="ประเภทสมาชิก" required />
      <div className="grid grid-cols-2 gap-3">
        {options.map(({ value: val, label, desc }) => {
          const selected = value === val;
          return (
            <button
              type="button"
              key={val}
              onClick={() => onChange(val)}
              className={`rounded-2xl border px-4 py-3 text-left transition ${
                selected
                  ? 'border-[#0194F3] bg-[#0194F3]/5 ring-2 ring-[#0194F3]/20'
                  : 'border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#0194F3]/50'
              }`}
            >
              <span className="block text-sm font-bold text-[#1E293B]">{label}</span>
              <span className="block text-xs text-[#64748B] mt-0.5">{desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// แถบข้อความแจ้งเตือน — error (แดง) / info (เขียว)
export function FormMessage({ error, info }) {
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-2xl px-4 py-3 text-center">
        {error}
      </div>
    );
  }
  if (info) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-2xl px-4 py-3 text-center">
        {info}
      </div>
    );
  }
  return null;
}

// ปุ่มหลัก (สีแดง) — เต็มความกว้าง มีสถานะ loading
export function SubmitButton({ loading, children, loadingText }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full bg-[#0194F3] hover:bg-[#0178C7] disabled:opacity-50 text-white font-black py-3.5 rounded-2xl transition text-base mt-2"
    >
      {loading ? (loadingText || 'กำลังดำเนินการ...') : children}
    </button>
  );
}
