import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AuthLayout, TextField, PasswordField, RoleSelector, FormMessage, SubmitButton } from '../../components/user/AuthUI';

// อ่านชื่อ-นามสกุลที่ดึงมาจาก provider (Google/LINE) ที่ callback เก็บไว้ → เอามา prefill
// full_name มาเป็นก้อนเดียว เช่น "สมชาย ใจดี" → แยกเป็น ชื่อ (คำแรก) + นามสกุล (ที่เหลือ)
function readPrefillName() {
  try {
    const raw = localStorage.getItem('social_profile');
    if (!raw) return { first: '', last: '' };
    const fullName = (JSON.parse(raw).full_name || '').trim();
    if (!fullName) return { first: '', last: '' };
    const parts = fullName.split(/\s+/);
    return { first: parts[0], last: parts.slice(1).join(' ') };
  } catch {
    return { first: '', last: '' };
  }
}

// หน้าเติมข้อมูลผู้ใช้ใหม่ที่มาจาก Social (Google/LINE)
// เข้ามาหน้านี้ตอน callback พบว่า isNewUser = true (มี pending token แล้ว)
// ผู้ใช้ต้องกรอกครบทุกช่อง → backend ถึงจะสร้างบัญชี (ถ้าไม่ครบจะไม่มีการสมัคร)
export default function CompleteProfile() {
  const navigate = useNavigate();
  const prefill = readPrefillName();
  const [username, setUsername] = useState('');
  const [first_name, setFirstName] = useState(prefill.first);
  const [last_name, setLastName] = useState(prefill.last);
  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user_role, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. username — ต้องตั้งเอง (4–20 ตัว ใช้ a-z 0-9 . _ )
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9._]{4,20}$/.test(cleanUsername)) {
      setError('username ต้องยาว 4–20 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด หรือขีดล่างเท่านั้น');
      return;
    }
    // 2. ชื่อ + นามสกุล ต้องกรอกครบ
    const cleanFirst = first_name.trim();
    const cleanLast = last_name.trim();
    if (!cleanFirst || !cleanLast) {
      setError('กรุณากรอกทั้งชื่อและนามสกุล');
      return;
    }
    // 3. ต้องเลือกประเภทสมาชิก
    if (!user_role) {
      setError('กรุณาเลือกประเภทสมาชิก (รายวัน หรือ รายเดือน)');
      return;
    }
    // 4. บังคับกรอกเบอร์โทร (เบอร์ไทย 9–10 หลัก ขึ้นต้น 0)
    const cleanPhone = phone_number.replace(/[\s-]/g, '');
    if (!/^0\d{8,9}$/.test(cleanPhone)) {
      setError('กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 08x-xxx-xxxx)');
      return;
    }
    // 5. บังคับตั้งรหัสผ่าน — ให้ผู้ใช้ social login ด้วย username/อีเมล + รหัสผ่านได้ภายหลัง
    if (password.length < 6) {
      setError('กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      // backend ใช้ token ระบุว่าเป็นบัญชีไหน (socialCompleteCheck)
      const res = await api.post('/auth/social/complete', {
        username: cleanUsername,
        full_name: `${cleanFirst} ${cleanLast}`,
        user_role,
        phone_number: cleanPhone,
        password,
      });
      // สมัครสำเร็จ → backend ออก token จริงให้ → อัปเดต session แล้วพาไปหน้าตาม role
      const { token, payload } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(payload));
      localStorage.removeItem('social_profile'); // ใช้เสร็จแล้ว ลบทิ้ง
      navigate(payload.role === 'Admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon="👤" tagline="ตั้งค่าบัญชี" title="กรอกข้อมูลสมาชิก">
      <p className="text-sm text-[#64748B] -mt-4 mb-6">
        อีกขั้นเดียว! กรอกข้อมูลให้ครบทุกช่องเพื่อสมัครสมาชิกให้เสร็จสมบูรณ์
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <RoleSelector value={user_role} onChange={setUserRole} />

        <TextField
          label="ชื่อผู้ใช้ (username) — ใช้เข้าสู่ระบบ" required
          value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ตั้งชื่อผู้ใช้ 4–20 ตัว"
        />

        <TextField
          label="ชื่อ" required
          value={first_name} onChange={(e) => setFirstName(e.target.value)} placeholder="ชื่อจริง"
        />

        <TextField
          label="นามสกุล" required
          value={last_name} onChange={(e) => setLastName(e.target.value)} placeholder="นามสกุล"
        />

        <TextField
          label="เบอร์โทรศัพท์" required type="tel"
          value={phone_number} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx"
        />

        <PasswordField
          label="ตั้งรหัสผ่าน" required
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร"
        />

        <FormMessage error={error} />

        <SubmitButton loading={loading} loadingText="กำลังบันทึก...">สมัครสมาชิก</SubmitButton>
      </form>
    </AuthLayout>
  );
}
