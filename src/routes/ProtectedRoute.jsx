import React from 'react';
import { Navigate } from 'react-router-dom';

// อ่าน user object จาก localStorage (คืน null ถ้าไม่มีหรือ JSON เสีย)
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
}

// ห่อหน้าที่ต้อง login — ถ้ายังไม่มี token ส่งไป /login
export function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// ห่อหน้า admin — ต้องเป็น Admin เท่านั้น
// ยังไม่ login → /login | login แล้วแต่ไม่ใช่ Admin → หน้าแรก
export function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = getUser();

  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.role !== 'Admin') return <Navigate to="/" replace />;

  return children;
}
