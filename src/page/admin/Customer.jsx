import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

const ROLES = ['Daily_Tenant', 'Monthly_Tenant', 'Admin'];

const Customers = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  // ถ้ามาจากหน้าอื่นพร้อมชื่อลูกค้า (เช่น กดเช็คอินรายเดือนเสร็จ) ให้ค้นหาชื่อนั้นให้เลย
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ member_id: null, username: '', password: '', full_name: '', phone_number: '', email: '', user_role: 'Daily_Tenant' });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/members');
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
        await api.put(`/members/${form.member_id}`, {
          full_name: form.full_name, phone_number: form.phone_number || null,
          email: form.email || null, user_role: form.user_role,
        });
      } else {
        if (!form.password) { alert('กรุณาระบุรหัสผ่าน'); setSaving(false); return; }
        await api.post('/register', {
          username: form.username, password: form.password,
          full_name: form.full_name, phone_number: form.phone_number || undefined,
          email: form.email || undefined, user_role: form.user_role,
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
      await api.delete(`/members/${id}`);
      setCustomers((prev) => prev.filter((c) => c.member_id !== id));
    } catch (err) {
      alert('ไม่สามารถลบได้: ' + (err.response?.data?.message || err.message));
    }
  };

  // สีของ badge บทบาท แยกตามประเภทผู้ใช้
  const roleBadge = (role) => {
    if (role === 'Admin') return { text: 'Admin', className: 'bg-purple-100 text-purple-700' };
    if (role === 'Monthly_Tenant') return { text: 'รายเดือน', className: 'bg-primary/10 text-primary' };
    return { text: 'รายวัน', className: 'bg-green-100 text-green-700' };
  };

  // ใช้ตัวอักษรแรกของชื่อเป็นไอคอนอวาตาร์ (ไม่ต้องพึ่งรูปภาพ)
  const avatarLetter = (name) => (name?.trim()?.[0] || '?').toUpperCase();

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-primary animate-pulse">กำลังโหลดข้อมูล...</div>;

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
        <button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded flex-shrink-0">
          เพิ่มสมาชิกใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* การ์ดเพิ่มสมาชิกใหม่ อยู่หน้าสุดของกริด */}
        <button
          onClick={openAddModal}
          className="border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 min-h-[220px] p-4"
        >
          <span className="text-3xl font-bold">+</span>
          <span className="font-semibold">เพิ่มสมาชิกใหม่</span>
        </button>

        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const badge = roleBadge(customer.user_role);
            return (
              <div key={customer.member_id} className="bg-card border border-border rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    {avatarLetter(customer.full_name)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{customer.full_name}</p>
                    <p className="text-muted-foreground text-sm truncate">{customer.username}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="bg-muted px-2 py-1 rounded-full">เบอร์โทร: {customer.phone_number || '-'}</span>
                  <span className="bg-muted px-2 py-1 rounded-full truncate max-w-full">อีเมล: {customer.email || '-'}</span>
                  <span className={`px-2 py-1 rounded-full font-semibold ${badge.className}`}>{badge.text}</span>
                </div>

                <div className="flex justify-end gap-2 mt-auto pt-2">
                  <button onClick={() => openEditModal(customer)} className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white text-sm">
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(customer.member_id, customer.full_name)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white text-sm">
                    ลบ
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="col-span-full text-center py-4 text-muted-foreground">ไม่พบข้อมูลสมาชิก</p>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
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
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-muted/50">ยกเลิก</button>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50">
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
