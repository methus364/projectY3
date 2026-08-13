// อ่านข้อมูลผู้ใช้ปัจจุบันจาก localStorage (ตั้งค่าตอน login/social callback)
export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
}

export function getUserRole() {
  return getCurrentUser()?.role || null;
}

export function isLoggedIn() {
  return !!localStorage.getItem('token');
}
