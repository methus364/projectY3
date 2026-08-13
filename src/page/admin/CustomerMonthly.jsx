import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../lib/api';

const money = (val) => (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
const fmt = (d) => (d ? d.split('T')[0] : '-');

// สีป้ายสถานะบิล
const invoiceStatusColor = (status) => {
  if (status === 'ชำระแล้ว') return 'bg-green-100 text-green-700';
  if (status === 'ชำระบางส่วน') return 'bg-yellow-100 text-yellow-700';
  if (status === 'ยกเลิก') return 'bg-muted text-muted-foreground';
  return 'bg-red-100 text-red-700';
};

// สีป้ายสถานะสัญญา
const contractStatusColor = (status) => {
  if (status === 'มีผลใช้งาน') return 'bg-green-100 text-green-700';
  if (status === 'หมดอายุ') return 'bg-muted text-muted-foreground';
  return 'bg-red-100 text-red-700';
};

// หน้านี้จัดการเฉพาะสมาชิกที่เป็นผู้เช่ารายเดือน (user_role = 'Monthly_Tenant')
const CustomersMonthly = () => {
  const [searchParams] = useSearchParams();
  const [customers, setCustomers] = useState([]);
  const [contracts, setContracts] = useState([]);   // สัญญาทั้งหมด (ทุกคน) — ใช้หาห้องปัจจุบัน + filter ต่อคน
  const [invoices, setInvoices] = useState([]);     // บิลทั้งหมด (ทุกคน) — filter ต่อคนตอนเปิดดูประวัติ
  const [loading, setLoading] = useState(true);
  // ถ้ามาจากหน้าอื่นพร้อมชื่อลูกค้า (เช่น กดเช็คอินรายเดือนเสร็จ) ให้ค้นหาชื่อนั้นให้เลย
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ member_id: null, username: '', password: '', full_name: '', phone_number: '', email: '' });
  const [saving, setSaving] = useState(false);

  // modal ดูประวัติการชำระเงิน / ดูสัญญา — เก็บลูกค้าที่กำลังเปิดดูอยู่
  const [billsTarget, setBillsTarget] = useState(null);
  const [contractsTarget, setContractsTarget] = useState(null);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [membersRes, contractsRes, invoicesRes] = await Promise.all([
        api.get('/members'),
        api.get('/contracts'),
        api.get('/invoices?rentType=monthly'),
      ]);
      setCustomers((membersRes.data.data || []).filter((c) => c.user_role === 'Monthly_Tenant'));
      setContracts(contractsRes.data.data || []);
      setInvoices(invoicesRes.data.data || []);
    } catch (err) {
      console.error('Fetch data error:', err);
      alert('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const filteredCustomers = customers.filter((c) =>
    c.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone_number?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  // ห้องปัจจุบันของลูกค้า = สัญญาที่ "มีผลใช้งาน" ล่าสุด (ถ้าไม่มี ใช้สัญญาล่าสุดที่เคยมี)
  const currentRoomOf = (memberId) => {
    const own = contracts.filter((c) => c.member_id === memberId);
    if (own.length === 0) return null;
    const active = own.find((c) => c.contract_status === 'มีผลใช้งาน');
    return active || own[0]; // contracts มาเรียง contract_id DESC จาก API อยู่แล้ว
  };

  const openAddModal = () => {
    setForm({ member_id: null, username: '', password: '', full_name: '', phone_number: '', email: '' });
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
          email: form.email || null, user_role: 'Monthly_Tenant',
        });
      } else {
        if (!form.password) { alert('กรุณาระบุรหัสผ่าน'); setSaving(false); return; }
        await api.post('/register', {
          username: form.username, password: form.password,
          full_name: form.full_name, phone_number: form.phone_number || undefined,
          email: form.email || undefined, user_role: 'Monthly_Tenant',
        });
      }
      await fetchAll();
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

  // ใช้ตัวอักษรแรกของชื่อเป็นไอคอนอวาตาร์ (ไม่ต้องพึ่งรูปภาพ)
  const avatarLetter = (name) => (name?.trim()?.[0] || '?').toUpperCase();

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-primary animate-pulse">กำลังโหลดข้อมูล...</div>;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex-shrink-0">จัดการลูกค้ารายเดือน</h1>

      <div className="flex flex-wrap gap-4 mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="ค้นหาชื่อ, username, เบอร์โทร, หรืออีเมล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 flex-grow min-w-[200px]"
        />
        <button onClick={openAddModal} className="bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded flex-shrink-0">
          เพิ่มลูกค้ารายเดือนใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* การ์ดเพิ่มลูกค้าใหม่ อยู่หน้าสุดของกริด */}
        <button
          onClick={openAddModal}
          className="border-2 border-dashed border-primary/40 rounded-lg flex flex-col items-center justify-center gap-2 text-primary hover:bg-primary/5 min-h-[220px] p-4"
        >
          <span className="text-3xl font-bold">+</span>
          <span className="font-semibold">เพิ่มลูกค้ารายเดือนใหม่</span>
        </button>

        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const room = currentRoomOf(customer.member_id);
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
                  <span className="px-2 py-1 rounded-full font-semibold bg-primary/10 text-primary">
                    {room ? `ห้อง ${room.room_number}` : 'ยังไม่มีห้อง'}
                  </span>
                </div>

                <div className="flex flex-wrap justify-end gap-2 mt-auto pt-2 text-sm">
                  <button onClick={() => setBillsTarget(customer)} className="bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-white">
                    ประวัติการชำระเงิน
                  </button>
                  <button onClick={() => setContractsTarget(customer)} className="bg-primary hover:bg-primary/90 px-3 py-1 rounded text-primary-foreground">
                    สัญญาเช่า
                  </button>
                  <button onClick={() => openEditModal(customer)} className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white">
                    แก้ไข
                  </button>
                  <button onClick={() => handleDelete(customer.member_id, customer.full_name)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-white">
                    ลบ
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <p className="col-span-full text-center py-4 text-muted-foreground">ไม่พบลูกค้ารายเดือน</p>
        )}
      </div>

      {/* Modal เพิ่ม/แก้ไขลูกค้า */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSubmit} className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">{isEdit ? 'แก้ไขลูกค้ารายเดือน' : 'เพิ่มลูกค้ารายเดือนใหม่'}</h2>

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

            <label className="block mb-4">
              อีเมล
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border rounded px-3 py-2 mt-1" />
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

      {/* Modal ประวัติการชำระเงิน — แสดงบิลแต่ละรอบเดือนของลูกค้าคนนี้ */}
      {billsTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setBillsTarget(null)}>
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">ประวัติการชำระเงิน — {billsTarget.full_name}</h2>
              <button onClick={() => setBillsTarget(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {(() => {
              const bills = invoices
                .filter((inv) => inv.member_id === billsTarget.member_id)
                .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));
              if (bills.length === 0) return <p className="text-muted-foreground text-center py-6">ยังไม่มีบิล</p>;
              return (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-border text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">รอบเดือน</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">ห้อง</th>
                        <th className="px-3 py-2 text-right font-medium text-muted-foreground">ยอดรวม</th>
                        <th className="px-3 py-2 text-center font-medium text-muted-foreground">สถานะ</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">ครบกำหนด</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {bills.map((inv) => (
                        <tr key={inv.invoice_id}>
                          <td className="px-3 py-2">{inv.invoice_date?.slice(0, 7)}</td>
                          <td className="px-3 py-2">{inv.room_number}</td>
                          <td className="px-3 py-2 text-right">{money(inv.total_amount)}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${invoiceStatusColor(inv.invoice_status)}`}>
                              {inv.invoice_status}
                            </span>
                          </td>
                          <td className="px-3 py-2">{fmt(inv.due_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Modal สัญญาเช่า — แสดงสัญญาทุกฉบับที่ผูกกับลูกค้าคนนี้ */}
      {contractsTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setContractsTarget(null)}>
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">สัญญาเช่า — {contractsTarget.full_name}</h2>
              <button onClick={() => setContractsTarget(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {(() => {
              const own = contracts.filter((c) => c.member_id === contractsTarget.member_id);
              if (own.length === 0) return <p className="text-muted-foreground text-center py-6">ยังไม่มีสัญญา</p>;
              return (
                <div className="space-y-3">
                  {own.map((c) => (
                    <div key={c.contract_id} className="border border-border rounded-lg p-3 text-sm">
                      <div className="flex flex-wrap justify-between items-center gap-2">
                        <span className="font-bold">CT-{String(c.contract_id).padStart(4, '0')} · ห้อง {c.room_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${contractStatusColor(c.contract_status)}`}>
                          {c.contract_status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">ระยะสัญญา: {fmt(c.start_date)} → {fmt(c.end_date)}</p>
                      <p className="text-muted-foreground">
                        เงินประกัน {money(c.security_deposit)} · ค่ามัดจำกุญแจ {money(c.key_deposit)}
                      </p>
                      {c.contract_file_url && (
                        <a href={c.contract_file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                          ดูไฟล์สัญญา
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersMonthly;
