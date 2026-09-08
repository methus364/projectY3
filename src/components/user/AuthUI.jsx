import React, { useState } from 'react';

// ============================================================
// ชุด UI กลางของหน้า auth (Login / Register / VerifyEmail / CompleteProfile)
// รวมดีไซน์ไว้ที่เดียว ให้ทุกหน้าหน้าตาเป็นระบบเดียวกัน + แก้ธีมที่เดียวจบ
// ============================================================

// โครงหน้า auth (ดีไซน์ split แบบ mobile app):
//  · จอกว้าง = รูปตึกเต็มจอ + การ์ดฟอร์มชิดซ้าย + กล่องโปรโมทมุมขวาล่าง
//  · จอแคบ  = รูปตึกพื้นหลัง + การ์ดฟอร์มกลางจอ
const SERIF = 'Georgia, "Times New Roman", serif';

// กล่องโปรโมท (กระจกฝ้าโปร่ง) — โชว์เฉพาะจอกว้าง มุมล่าง (ฝั่งตรงข้ามการ์ด)
// promo = { badge?, eyebrow, title, desc? } · side = 'left' | 'right'
function PromoBox({ promo, side }) {
  const pos = side === 'left' ? 'left-12' : 'right-12';
  return (
    <div className={`hidden lg:block absolute ${pos} bottom-11 max-w-md rounded-[22px] border border-white/20 bg-[#0a1626]/45 backdrop-blur-xl p-7`}>
      {promo.badge && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur px-3 py-1.5 mb-3.5">
          <span className="text-sm">📍</span>
          <span className="text-[#EAF6FF] text-xs font-semibold">{promo.badge}</span>
        </div>
      )}
      <p className="text-white/80 italic text-2xl tracking-wide" style={{ fontFamily: SERIF }}>{promo.eyebrow}</p>
      {/* หัวข้อ + ประกายดาวทองระยิบระยับ */}
      <div className="relative inline-block">
        <span className="sparkle text-sm" style={{ top: '-8px', left: '-10px', animationDelay: '0s' }}>✦</span>
        <span className="sparkle text-xs" style={{ top: '6px', right: '-14px', animationDelay: '0.5s' }}>✦</span>
        <span className="sparkle text-[10px]" style={{ bottom: '2px', left: '30%', animationDelay: '1s' }}>✧</span>
        <span className="sparkle text-xs" style={{ top: '-6px', right: '32%', animationDelay: '1.4s' }}>✦</span>
        <span className="sparkle text-[10px]" style={{ bottom: '-6px', right: '-8px', animationDelay: '0.8s' }}>✧</span>
        <p className="gold-shimmer text-5xl font-bold mt-0.5 leading-tight" style={{ fontFamily: SERIF }}>{promo.title}</p>
      </div>
      <div className="w-14 h-[3px] rounded bg-[#D9B25F] mt-4 mb-3.5" />
      {promo.desc && <p className="text-white/85 text-[15px] leading-relaxed">{promo.desc}</p>}
    </div>
  );
}

// promo เริ่มต้น (หน้า Login) — การ์ดชิดซ้าย, โปรโมทขวาล่าง
const DEFAULT_PROMO = {
  badge: 'อ.เมือง จ.เลย',
  eyebrow: 'Welcome To',
  title: 'Around Loei',
  desc: 'ที่พักสไตล์โมเดิร์นใจกลางเมืองเลย สะดวก สงบ พร้อมต้อนรับทุกการเดินทางของคุณ',
};

export function AuthLayout({ icon, tagline, title, children, align = 'left', promo = DEFAULT_PROMO }) {
  // align = ฝั่งการ์ด · กล่องโปรโมทอยู่ฝั่งตรงข้าม
  const cardJustify = align === 'right' ? 'lg:justify-end' : 'lg:justify-start';
  const promoSide = align === 'right' ? 'left' : 'right';
  return (
    <div className="relative min-h-screen bg-[#0B1F33]">
      {/* รูปตึกจริง (จากแอพ) เป็นพื้นหลังเต็มจอ + ไล่เฉดทับให้อ่านง่าย */}
      <img src="/hero-around-loei.jpg" alt="" className="fixed inset-0 w-full h-full object-cover" />
      <div className="fixed inset-0 bg-gradient-to-b from-[#061424]/45 via-[#061424]/25 to-[#040e1a]/85" />

      {/* เนื้อหา (ลอยเหนือรูป) — จอแคบ: กลาง · จอกว้าง: ชิดซ้าย/ขวาตาม align */}
      <div className={`relative z-10 min-h-screen flex items-center justify-center ${cardJustify} px-4 lg:px-14 py-10`}>
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
      </div>

      {/* กล่องโปรโมทมุมล่าง (จอกว้าง) — ฝั่งตรงข้ามการ์ด */}
      <PromoBox promo={promo} side={promoSide} />
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
