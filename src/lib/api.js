import axios from 'axios';

// axios instance กลาง — ทุกหน้า import จากนี่แทนการ hardcode localhost
// URL สลับอัตโนมัติ: dev = localhost:5000, prod = onrender.com (ดู .env / .env.production)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// ใส่ Authorization: Bearer <token> ทุก request อัตโนมัติ
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
