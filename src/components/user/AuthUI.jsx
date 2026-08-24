import React, { useState } from 'react';

// ============================================================
// ชุด UI กลางของหน้า auth (Login / Register / VerifyEmail / CompleteProfile)
// รวมดีไซน์ไว้ที่เดียว ให้ทุกหน้าหน้าตาเป็นระบบเดียวกัน + แก้ธีมที่เดียวจบ
// ============================================================

// โครงหน้า auth: หัวสีฟ้า (ไอคอน + แบรนด์ + คำโปรย) + การ์ดขาวโค้งมน
export function AuthLayout({ icon, tagline, title, children }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* หัวสีฟ้า (ธีมเดียวกับ mobile) */}
      <div className="bg-[#0178C7] pt-14 pb-16 px-6 flex flex-col items-center">
        <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center mb-4">
          <span className="text-3xl">{icon}</span>
        </div>
        <h1 className="text-white text-2xl font-black">Around Loei</h1>
        <p className="text-white/80 text-sm font-semibold mt-1">{tagline}</p>
      </div>

      {/* การ์ดเนื้อหา */}
      <div className="bg-white rounded-t-[40px] -mt-8 flex-1 px-6 pt-8 pb-10 max-w-md w-full mx-auto shadow-lg">
        {title && <h2 className="text-[#1E293B] text-xl font-black mb-6">{title}</h2>}
        {children}
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
