import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AuthLayout, TextField, PasswordField, RoleSelector, FormMessage, SubmitButton } from '../../components/user/AuthUI';

// หน้าเติมข้อมูลผู้ใช้ใหม่ที่มาจาก Social (Google/LINE)
// เข้ามาหน้านี้ตอน callback พบว่า isNewUser = true (ต้องมี token แล้ว)
// ชื่อ-นามสกุลดึงมาจาก provider อัตโนมัติแล้ว → หน้านี้ให้ตั้ง username เอง +
// บังคับเลือกประเภทผู้เช่า + บังคับกรอกเบอร์โทร + ตั้งรหัสผ่าน
export default function CompleteProfile() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user_role, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. ตรวจ username — ต้องตั้งเอง (4–20 ตัว ใช้ a-z 0-9 . _ )
    const cleanUsername = username.trim();
    if (!/^[a-zA-Z0-9._]{4,20}$/.test(cleanUsername)) {
      setError('username ต้องยาว 4–20 ตัว ใช้ตัวอักษรอังกฤษ ตัวเลข จุด หรือขีดล่างเท่านั้น');
      return;
    }
    // 2. ต้องเลือกประเภทสมาชิก
    if (!user_role) {
      setError('กรุณาเลือกประเภทสมาชิก (รายวัน หรือ รายเดือน)');
      return;
    }
    // 3. บังคับกรอกเบอร์โทร (เบอร์ไทย 9–10 หลัก ขึ้นต้น 0)
    const cleanPhone = phone_number.replace(/[\s-]/g, '');
    if (!/^0\d{8,9}$/.test(cleanPhone)) {
      setError('กรุณากรอกเบอร์โทรให้ถูกต้อง (เช่น 08x-xxx-xxxx)');
      return;
    }
    // 4. บังคับตั้งรหัสผ่าน — ให้ผู้ใช้ social login ด้วย username/อีเมล + รหัสผ่านได้ภายหลัง
    if (password.length < 6) {
      setError('กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      // backend ใช้ token ระบุว่าเป็นบัญชีไหน (socialCompleteCheck)
      const res = await api.post('/auth/social/complete', {
        username: cleanUsername,
        user_role,
        phone_number: cleanPhone,
        password,
      });
      // backend ออก token ใหม่ให้ role มีผลทันที → อัปเดต session แล้วพาไปหน้าตาม role
      const { token, payload } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(payload));
      navigate(payload.role === 'Admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout icon="👤" tagline="ตั้งค่าบัญชี" title="เลือกประเภทสมาชิก">
      <p className="text-sm text-[#64748B] -mt-4 mb-6">
        อีกขั้นเดียว! ตั้งชื่อผู้ใช้ เลือกประเภทการเช่า กรอกเบอร์โทร และตั้งรหัสผ่านเพื่อเริ่มใช้งาน
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="ชื่อผู้ใช้ (username)" required
          value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ตั้งชื่อผู้ใช้ 4–20 ตัว"
        />

        <RoleSelector value={user_role} onChange={setUserRole} />

        <TextField
          label="เบอร์โทรศัพท์" required type="tel"
          value={phone_number} onChange={(e) => setPhone(e.target.value)} placeholder="08x-xxx-xxxx"
        />

        <PasswordField
          label="ตั้งรหัสผ่าน" required
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="อย่างน้อย 6 ตัวอักษร"
        />

        <FormMessage error={error} />

        <SubmitButton loading={loading} loadingText="กำลังบันทึก...">เริ่มใช้งาน</SubmitButton>
      </form>
    </AuthLayout>
  );
}
