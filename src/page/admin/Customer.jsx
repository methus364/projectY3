import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';
const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const ROLES = ['Daily_Tenant', 'Monthly_Tenant', 'Admin'];

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ member_id: null, username: '', password: '', full_name: '', phone_number: '', email: '', user_role: 'Daily_Tenant' });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/members`, getAuthHeader());
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error('Fetch members error:', err);
      alert('ไม่สามารถโหลดข้อมูลสมาชิกได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filteredCustomers = customers.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const openAddModal = () => {
    setForm({ member_id: null, username: '', password: '', full_name: '', phone_number: '', email: '', user_role: 'Daily_Tenant' });
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setForm({
      member_id: customer.member_id,
      username: customer.username,
      password: '',
      full_name: customer.full_name,
      phone_number: customer.phone_number || '',
      email: customer.email || '',
      user_role: customer.user_role,
    });
    setIsEdit(true);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(
          `${API}/members/${form.member_id}`,
          { full_name: form.full_name, phone_number: form.phone_number || null, email: form.email || null, user_role: form.user_role },
          getAuthHeader()
        );
      } else {
        if (!form.password) { alert('กรุณาระบุรหัสผ่าน'); setSaving(false); return; }
        await axios.post(`${API}/register`, {
          username: form.username,
          password: form.password,
          full_name: form.full_name,
          phone_number: form.phone_number || undefined,
          email: form.email || undefined,
          user_role: form.user_role,
        });
      }
      await fetchCustomers();
      setShowModal(false);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`ยืนยันลบสมาชิก "${name}" ?`)) return;
    try {
      await axios.delete(`${API}/members/${id}`, getAuthHeader());
      setCustomers((prev) => prev.filter((c) => c.member_id !== id));
    } catch (err) {
      alert('ไม่สามารถลบได้: ' + (err.response?.data?.message || err.message));
    }
  };

  const roleLabel = (role) => {
    if (role === 'Admin') return <span className="text-purple-600 font-semibold">Admin</span>;
    if (role === 'Monthly_Tenant') return <span className="text-blue-600 font-semibold">รายเดือน</span>;
    return <span className="text-green-600 font-semibold">รายวัน</span>;
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-blue-600 animate-pulse">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex-shrink-0">รายการสมาชิก</h1>

      <div className="flex flex-wrap gap-4 mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, username, เบอร์โทร, หรืออีเมล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 flex-grow min-w-[200px]"
        />
        <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded flex-shrink-0">
          เพิ่มสมาชิกใหม่
        </button>
      </div>

      <div className="flex-grow overflow-auto border border-gray-300 rounded">
        <table className="w-full border-collapse border border-gray-300 min-w-[700px]">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">ชื่อ-นามสกุล</th>
              <th className="border border-gray-300 px-4 py-2 text-left">Username</th>
              <th className="border border-gray-300 px-4 py-2 text-left">เบอร์โทร</th>
              <th className="border border-gray-300 px-4 py-2 text-left">อีเมล</th>
              <th className="border border-gray-300 px-4 py-2 text-left">บทบาท</th>
              <th className="border border-gray-300 px-4 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr key={customer.member_id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2">{customer.full_name}</td>
                  <td className="border border-gray-300 px-4 py-2 text-gray-500">{customer.username}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.phone_number || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.email || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">{roleLabel(customer.user_role)}</td>
                  <td className="border border-gray-300 px-4 py-2 text-center space-x-2">
                    <button onClick={() => openEditModal(customer)} className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white">
                      แก้ไข
                    </button>
                    <button onClick={() => handleDelete(customer.member_id, customer.full_name)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white">
                      ลบ
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">ไม่พบข้อมูลสมาชิก</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{isEdit ? 'แก้ไขสมาชิก' : 'เพิ่มสมาชิกใหม่'}</h2>

            {!isEdit && (
              <>
                <label className="block mb-2">
                  Username *
                  <input type="text" name="username" value={form.username} onChange={handleChange} required className="w-full border rounded px-3 py-2 mt-1" />
                </label>
                <label className="block mb-2">
                  รหัสผ่าน *
                  <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full border rounded px-3 py-2 mt-1" />
                </label>
              </>
            )}

            <label className="block mb-2">
              ชื่อ-นามสกุล *
              <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required className="w-full border rounded px-3 py-2 mt-1" />
            </label>

            <label className="block mb-2">
              เบอร์โทร
              <input type="tel" name="phone_number" value={form.phone_number} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
            </label>

            <label className="block mb-2">
              อีเมล
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
            </label>

            <label className="block mb-4">
              บทบาท
              <select name="user_role" value={form.user_role} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1">
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r === 'Daily_Tenant' ? 'ผู้เช่ารายวัน' : r === 'Monthly_Tenant' ? 'ผู้เช่ารายเดือน' : 'Admin'}</option>
                ))}
              </select>
            </label>

            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100">ยกเลิก</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Customers;
