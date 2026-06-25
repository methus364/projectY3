import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// คืนค่า 'YYYY-MM' ของเดือนปัจจุบัน
function getCurrentMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

// สีป้ายสถานะบิล
const statusBadge = (status) => {
    if (status === 'ชำระแล้ว') return 'bg-green-100 text-green-800';
    if (status === 'ชำระบางส่วน') return 'bg-blue-100 text-blue-800';
    if (status === 'ยกเลิก') return 'bg-gray-200 text-gray-600';
    return 'bg-yellow-100 text-yellow-800'; // ยังไม่ชำระ
};

const Bill = () => {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [statusFilter, setStatusFilter] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // modal ออกบิล
    const [showCreate, setShowCreate] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [createForm, setCreateForm] = useState({ booking_id: '', month: getCurrentMonth() });
    const [saving, setSaving] = useState(false);

    // modal แก้ไขบิล
    const [editInvoice, setEditInvoice] = useState(null);
    const [editDetails, setEditDetails] = useState([]);

    // ==========================================
    // โหลดรายการบิลตามเดือน/สถานะที่เลือก
    // ==========================================
    const fetchInvoices = async () => {
        try {
            setLoading(true);
            // ประกอบ query string จาก filter ที่มีค่า
            const params = new URLSearchParams();
            if (selectedMonth) params.append('month', selectedMonth);
            if (statusFilter) params.append('status', statusFilter);

            const res = await api.get(`/invoices?${params.toString()}`);
            if (res.data.success) {
                setInvoices(res.data.data);
            }
        } catch (err) {
            console.error('โหลดรายการบิลไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [selectedMonth, statusFilter]);

    // ==========================================
    // เปิด modal ออกบิล — โหลดรายการการจองให้เลือก
    // ==========================================
    const openCreate = async () => {
        setCreateForm({ booking_id: '', month: selectedMonth });
        setShowCreate(true);
        try {
            const res = await api.get('/admin/bookings');
            if (res.data.success) {
                // เลือกเฉพาะการจองที่กำลังเข้าพัก (ออกบิลให้คนที่อยู่จริง)
                const active = res.data.data.filter((b) => b.bookingStatus === 'กำลังเข้าพัก');
                setBookings(active);
            }
        } catch (err) {
            console.error('โหลดรายการจองไม่สำเร็จ:', err);
        }
    };

    // ==========================================
    // ออกบิล 1 ใบ
    // ==========================================
    const handleCreate = async () => {
        if (!createForm.booking_id) {
            alert('กรุณาเลือกการจอง');
            return;
        }
        try {
            setSaving(true);
            const res = await api.post('/invoice', {
                booking_id: Number(createForm.booking_id), month: createForm.month,
            });
            if (res.data.success) {
                alert(res.data.message);
                setShowCreate(false);
                fetchInvoices();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'ออกบิลไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ออกบิลรายเดือนยกชุด
    // ==========================================
    const handleGenerateMonthly = async () => {
        if (!window.confirm(`ออกบิลรายเดือนสำหรับเดือน ${selectedMonth} ให้ทุกห้องที่ยังไม่มีบิล?`)) return;
        try {
            setLoading(true);
            const res = await api.post('/invoices/generate-monthly', { month: selectedMonth });
            if (res.data.success) {
                alert(res.data.message);
                fetchInvoices();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'ออกบิลรายเดือนไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // เปิด PDF (ต้องแนบ token จึงดึงเป็น blob แล้วเปิดแท็บใหม่)
    // ==========================================
    const openPdf = async (invoiceId) => {
        try {
            const res = await api.get(`/invoice/${invoiceId}/pdf`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(res.data);
            window.open(url, '_blank');
        } catch (err) {
            console.error('เปิด PDF ไม่สำเร็จ:', err);
            alert('เปิด PDF ไม่สำเร็จ');
        }
    };

    // ==========================================
    // ส่ง/ส่งซ้ำอีเมล
    // ==========================================
    const sendEmail = async (invoiceId) => {
        try {
            const res = await api.post(`/invoice/${invoiceId}/send`, {});
            alert(res.data.message);
        } catch (err) {
            alert(err.response?.data?.message || 'ส่งอีเมลไม่สำเร็จ');
        }
    };

    // ==========================================
    // เปิด modal แก้ไขบิล — โหลดรายการย่อยปัจจุบัน
    // ==========================================
    const openEdit = async (invoice) => {
        try {
            const res = await api.get(`/invoice/${invoice.invoice_id}`);
            if (res.data.success) {
                setEditInvoice(res.data.data);
                setEditDetails(res.data.data.details.map((d) => ({
                    item_name: d.item_name,
                    quantity: d.quantity,
                    unit_price: d.unit_price,
                })));
            }
        } catch (err) {
            console.error('โหลดบิลไม่สำเร็จ:', err);
        }
    };

    const updateDetailField = (index, field, value) => {
        setEditDetails((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            return next;
        });
    };

    // คำนวณยอดรวมฝั่ง client เพื่อแสดงตอนแก้ไข (server จะคำนวณซ้ำตอนบันทึก)
    const editTotal = editDetails.reduce(
        (sum, d) => sum + (Number(d.quantity) || 0) * (Number(d.unit_price) || 0),
        0
    );

    const handleUpdate = async () => {
        try {
            setSaving(true);
            const res = await api.put(`/invoice/${editInvoice.invoice_id}`, { details: editDetails });
            if (res.data.success) {
                setEditInvoice(null);
                fetchInvoices();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'แก้ไขบิลไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const money = (val) => (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

    return (
        <>
            <div className="flex w-full flex-col bg-background p-6">

                {/* ส่วนหัว + filter + ปุ่ม action */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">ใบแจ้งหนี้</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium text-foreground">เดือน:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="ยังไม่ชำระ">ยังไม่ชำระ</option>
                            <option value="ชำระบางส่วน">ชำระบางส่วน</option>
                            <option value="ชำระแล้ว">ชำระแล้ว</option>
                            <option value="ยกเลิก">ยกเลิก</option>
                        </select>
                        <button
                            onClick={handleGenerateMonthly}
                            className="px-4 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                        >
                            ออกบิลรายเดือน
                        </button>
                        <button
                            onClick={openCreate}
                            className="px-4 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        >
                            + ออกบิล
                        </button>
                    </div>
                </div>

                {/* ตารางบิล */}
                <div className="bg-card shadow-md rounded-lg overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">เลขที่</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ห้อง</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ผู้เช่า</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ค่าห้อง</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ค่าน้ำ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ค่าไฟ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">รวม</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {invoices.map((inv) => (
                                    <tr key={inv.invoice_id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            INV-{new Date(inv.invoice_date).getFullYear()}-{String(inv.invoice_id).padStart(4, '0')}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{inv.room_number}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{inv.guest_name || '—'}</td>
                                        <td className="px-4 py-3 text-right text-foreground">{money(inv.room_cost)}</td>
                                        <td className="px-4 py-3 text-right text-blue-600">{money(inv.water_cost)}</td>
                                        <td className="px-4 py-3 text-right text-yellow-600">{money(inv.elec_cost)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-foreground">{money(inv.total_amount)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(inv.invoice_status)}`}>
                                                {inv.invoice_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                                            <button onClick={() => openPdf(inv.invoice_id)} className="text-sm text-muted-foreground hover:text-foreground">PDF</button>
                                            <button onClick={() => sendEmail(inv.invoice_id)} className="text-sm text-primary hover:text-primary/70">ส่งเมล</button>
                                            {/* แก้ไขได้เฉพาะบิลที่ยังไม่ชำระ */}
                                            <button
                                                onClick={() => openEdit(inv)}
                                                disabled={inv.invoice_status === 'ชำระแล้ว'}
                                                className="text-sm text-primary hover:text-primary/70 disabled:text-muted-foreground/40 disabled:cursor-not-allowed"
                                            >
                                                แก้ไข
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {invoices.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10 text-muted-foreground">
                                            ไม่พบใบแจ้งหนี้ในเดือนนี้
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal ออกบิล */}
            {showCreate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-foreground mb-5">ออกใบแจ้งหนี้</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground mb-1">การจอง (ห้อง / ผู้เช่า)</label>
                            <select
                                value={createForm.booking_id}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, booking_id: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">— เลือกการจอง —</option>
                                {bookings.map((b) => (
                                    <option key={b.bookingId} value={b.bookingId}>
                                        ห้อง {b.roomNumber} · {b.guestName || 'ไม่ระบุ'} ({b.rentType === 'monthly' ? 'รายเดือน' : 'รายวัน'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-foreground mb-1">เดือนที่ออกบิล</label>
                            <input
                                type="month"
                                value={createForm.month}
                                onChange={(e) => setCreateForm((prev) => ({ ...prev, month: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
                                ยกเลิก
                            </button>
                            <button onClick={handleCreate} disabled={saving} className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50">
                                {saving ? 'กำลังออกบิล...' : 'ออกบิล + ส่งเมล'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal แก้ไขบิล */}
            {editInvoice && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-bold text-foreground mb-1">แก้ไขใบแจ้งหนี้</h2>
                        <p className="text-sm text-muted-foreground mb-5">
                            ห้อง {editInvoice.room_number} · {editInvoice.guest_name || '—'}
                        </p>

                        <table className="w-full text-sm mb-4">
                            <thead>
                                <tr className="text-left text-muted-foreground border-b">
                                    <th className="py-2">รายการ</th>
                                    <th className="py-2 w-24 text-center">จำนวน</th>
                                    <th className="py-2 w-28 text-right">ราคา/หน่วย</th>
                                    <th className="py-2 w-28 text-right">รวม</th>
                                </tr>
                            </thead>
                            <tbody>
                                {editDetails.map((d, i) => (
                                    <tr key={i} className="border-b">
                                        <td className="py-2">
                                            <input
                                                type="text"
                                                value={d.item_name}
                                                onChange={(e) => updateDetailField(i, 'item_name', e.target.value)}
                                                className="w-full border border-border rounded px-2 py-1"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={d.quantity}
                                                onChange={(e) => updateDetailField(i, 'quantity', e.target.value)}
                                                className="w-full border border-border rounded px-2 py-1 text-center"
                                            />
                                        </td>
                                        <td className="py-2">
                                            <input
                                                type="number"
                                                value={d.unit_price}
                                                onChange={(e) => updateDetailField(i, 'unit_price', e.target.value)}
                                                className="w-full border border-border rounded px-2 py-1 text-right"
                                            />
                                        </td>
                                        <td className="py-2 text-right text-foreground">
                                            {money((Number(d.quantity) || 0) * (Number(d.unit_price) || 0))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="text-right font-semibold text-foreground mb-6">
                            ยอดรวม: {money(editTotal)} บาท
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setEditInvoice(null)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
                                ยกเลิก
                            </button>
                            <button onClick={handleUpdate} disabled={saving} className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Bill;
