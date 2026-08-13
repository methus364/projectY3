import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { AuthLayout, TextField, PasswordField, RoleSelector, FormMessage, SubmitButton } from '../../components/user/AuthUI';

// หน้าเติมข้อมูลผู้ใช้ใหม่ที่มาจาก Social (Google/LINE)
// เข้ามาหน้านี้ตอน callback พบว่า isNewUser = true (ต้องมี token แล้ว)
// บังคับเลือกประเภทผู้เช่า (รายวัน/รายเดือน) + ตั้งรหัสผ่าน/เบอร์ได้ (ไม่บังคับ)
export default function CompleteProfile() {
  const navigate = useNavigate();
  const [phone_number, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [user_role, setUserRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user_role) {
      setError('กรุณาเลือกประเภทสมาชิก (รายวัน หรือ รายเดือน)');
      return;
    }
    // บังคับตั้งรหัสผ่าน — ผู้ใช้ใหม่จาก Google ต้องมีรหัสผ่าน (backend สร้างบัญชีตอนนี้)
    // และช่วยให้ผู้ใช้ social ทุกคน login ด้วยอีเมล+รหัสผ่านได้ภายหลัง
    if (password.length < 6) {
      setError('กรุณาตั้งรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    try {
      // ส่งเฉพาะ field ที่กรอก — backend ใช้ token ระบุว่าเป็นบัญชีไหน (authCheck)
      const res = await api.post('/auth/social/complete', {
        user_role,
        phone_number: phone_number || undefined,
        password: password || undefined,
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
        อีกขั้นเดียว! เลือกประเภทการเช่าและตั้งรหัสผ่านเพื่อเริ่มใช้งาน (ใช้เข้าสู่ระบบด้วยอีเมลได้ภายหลัง)
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <RoleSelector value={user_role} onChange={setUserRole} />

        <TextField
          label="เบอร์โทรศัพท์ (ไม่บังคับ)" type="tel"
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
