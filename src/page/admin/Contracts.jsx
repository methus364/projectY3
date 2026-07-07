import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// สีป้ายสถานะสัญญา
const statusBadge = (status) => {
    if (status === 'มีผลใช้งาน') return 'bg-green-100 text-green-800';
    if (status === 'หมดอายุ') return 'bg-gray-200 text-gray-600';
    if (status === 'ยกเลิกสัญญา') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
};

const money = (val) => (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });
const fmt = (d) => (d ? d.split('T')[0] : '-');

// จำนวนวันที่เหลือจนถึงวันสิ้นสุดสัญญา (ติดลบ = เลยมาแล้ว)
const daysToExpiry = (endDate) => {
    if (!endDate) return null;
    return Math.ceil((new Date(endDate) - new Date()) / 86400000);
};

// ฟอร์มเคลียร์สัญญาเริ่มต้น
const emptySettle = {
    move_out_date: '',
    key_returned: false,
    notice_given: false,
    rent_refund: 0,
    damage_cost: 0,
    cleaning_cost: 0,
    utility_cost: 0,
    outstanding_cost: 0,
};

const Contracts = () => {
    const [statusFilter, setStatusFilter] = useState('');
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);

    // modal เคลียร์สัญญา (คืนมัดจำ)
    const [settleContract, setSettleContract] = useState(null);
    const [settleForm, setSettleForm] = useState(emptySettle);
    const [extraDeductions, setExtraDeductions] = useState([]); // [{item_name, amount}]
    const [saving, setSaving] = useState(false);

    // modal ต่อสัญญา
    const [renewTarget, setRenewTarget] = useState(null);
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewFile, setRenewFile] = useState(null);

    // modal ประวัติการต่อสัญญา
    const [historyRows, setHistoryRows] = useState(null); // null = ปิด, [] = เปิดแต่ว่าง

    // ==========================================
    // โหลดรายการสัญญาตามสถานะที่เลือก
    // ==========================================
    const fetchContracts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            const res = await api.get(`/contracts?${params.toString()}`);
            if (res.data.success) setContracts(res.data.data);
        } catch (err) {
            console.error('โหลดรายการสัญญาไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [statusFilter]);

    // ==========================================
    // แจ้งย้ายออก: ยืนยัน / ยกเลิก
    // ==========================================
    const confirmNotice = async (c) => {
        if (!window.confirm(`ยืนยันการแจ้งย้ายออกของห้อง ${c.room_number}? (เริ่มนับ 30 วัน)`)) return;
        try {
            const res = await api.put(`/contract/${c.contract_id}/notice`, {});
            if (res.data.success) { alert(res.data.message); fetchContracts(); }
        } catch (err) {
            alert(err.response?.data?.message || 'ยืนยันไม่สำเร็จ');
        }
    };

    const cancelNotice = async (c) => {
        if (!window.confirm(`ยกเลิกการแจ้งย้ายออกของห้อง ${c.room_number}?`)) return;
        try {
            const res = await api.put(`/contract/${c.contract_id}/notice/cancel`);
            if (res.data.success) { alert(res.data.message); fetchContracts(); }
        } catch (err) {
            alert(err.response?.data?.message || 'ยกเลิกไม่สำเร็จ');
        }
    };

    // ==========================================
    // ต่อสัญญา
    // ==========================================
    const openRenew = (c) => {
        setRenewTarget(c);
        setRenewMonths(12);
        setRenewFile(null);
    };

    const submitRenew = async () => {
        try {
            setSaving(true);
            const form = new FormData();
            form.append('months', renewMonths);
            if (renewFile) form.append('contract_file', renewFile);
            const res = await api.put(`/contract/${renewTarget.contract_id}/renew`, form);
            if (res.data.success) {
                alert(res.data.message);
                setRenewTarget(null);
                fetchContracts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'ต่อสัญญาไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // ประวัติการต่อสัญญา (audit log)
    // ==========================================
    const viewHistory = async (c) => {
        try {
            const res = await api.get(`/contract/${c.contract_id}/history`);
            if (res.data.success) setHistoryRows(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || 'ดึงประวัติไม่สำเร็จ');
        }
    };

    // ==========================================
    // เคลียร์สัญญา
    // ==========================================
    const openSettle = (contract) => {
        setSettleContract(contract);
        setSettleForm({ ...emptySettle, move_out_date: new Date().toISOString().split('T')[0] });
        setExtraDeductions([]);
    };

    const updateForm = (field, value) => {
        setSettleForm((prev) => ({ ...prev, [field]: value }));
    };

    // จัดการรายการหักเพิ่มเติม
    const addExtra = () => setExtraDeductions((prev) => [...prev, { item_name: '', amount: 0 }]);
    const updateExtra = (i, field, value) =>
        setExtraDeductions((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)));
    const removeExtra = (i) => setExtraDeductions((prev) => prev.filter((_, idx) => idx !== i));

    // คำนวณเงินคืนฝั่ง client เพื่อแสดง preview (server จะคำนวณซ้ำตอนบันทึก)
    const previewRefund = () => {
        if (!settleContract) return 0;
        const security = Number(settleContract.security_deposit) || 0;
        const key = Number(settleContract.key_deposit) || 0;
        const forfeited = settleForm.move_out_date && new Date(settleForm.move_out_date) < new Date(settleContract.end_date);

        const rentRefund = settleForm.notice_given ? (Number(settleForm.rent_refund) || 0) : 0;
        const securityBack = forfeited ? 0 : security;
        const keyBack = settleForm.key_returned ? key : 0;
        const extraTotal = extraDeductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        const deductions =
            (Number(settleForm.damage_cost) || 0) +
            (Number(settleForm.cleaning_cost) || 0) +
            (Number(settleForm.utility_cost) || 0) +
            (Number(settleForm.outstanding_cost) || 0) +
            extraTotal;

        return rentRefund + securityBack + keyBack - deductions;
    };

    const isForfeited =
        settleContract &&
        settleForm.move_out_date &&
        new Date(settleForm.move_out_date) < new Date(settleContract.end_date);

    const handleSettle = async () => {
        if (!settleForm.move_out_date) {
            alert('กรุณาระบุวันย้ายออก');
            return;
        }
        try {
            setSaving(true);
            // ส่งเฉพาะรายการหักที่กรอกชื่อแล้ว
            const extras = extraDeductions.filter((d) => d.item_name.trim());
            const res = await api.post(`/contract/${settleContract.contract_id}/settle`, {
                ...settleForm,
                extra_deductions: extras,
            });
            if (res.data.success) {
                alert(res.data.message);
                setSettleContract(null);
                fetchContracts();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'เคลียร์สัญญาไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="flex w-full flex-col bg-background p-6">

                {/* ส่วนหัว + filter */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">สัญญาเช่า</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="text-sm font-medium text-foreground">สถานะ:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">ทุกสถานะ</option>
                            <option value="มีผลใช้งาน">มีผลใช้งาน</option>
                            <option value="หมดอายุ">หมดอายุ</option>
                            <option value="ยกเลิกสัญญา">ยกเลิกสัญญา</option>
                        </select>
                    </div>
                </div>

                {/* ตารางสัญญา */}
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
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ระยะสัญญา</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">เงินคืน</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {contracts.map((c) => {
                                    const days = daysToExpiry(c.end_date);
                                    const active = c.contract_status === 'มีผลใช้งาน' && !c.settled_at;
                                    const nearExpiry = active && days !== null && days <= 30 && days >= 0;
                                    const pendingNotice = active && c.notice_requested_at && !c.notice_date;
                                    const noticed = active && c.notice_date;
                                    return (
                                        <tr key={c.contract_id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                                CT-{String(c.contract_id).padStart(4, '0')}
                                            </td>
                                            <td className="px-4 py-3 text-foreground">{c.room_number}</td>
                                            <td className="px-4 py-3 text-muted-foreground">{c.guest_name || '—'}</td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {fmt(c.start_date)} → {fmt(c.end_date)}
                                            </td>
                                            <td className="px-4 py-3 text-center space-y-1">
                                                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusBadge(c.contract_status)}`}>
                                                    {c.contract_status}
                                                </span>
                                                {/* badge แจ้งเตือนต่างๆ */}
                                                {pendingNotice && <span className="block text-[10px] font-bold text-orange-600">📩 คำขอแจ้งย้ายออก</span>}
                                                {noticed && <span className="block text-[10px] font-bold text-red-600">🚪 แจ้งย้ายออกแล้ว</span>}
                                                {nearExpiry && <span className="block text-[10px] font-bold text-amber-600">⏰ ใกล้ครบสัญญา ({days} วัน)</span>}
                                                {active && c.renewal_requested_at && <span className="block text-[10px] font-bold text-blue-600">🔄 ขอต่อสัญญา</span>}
                                            </td>
                                            <td className="px-4 py-3 text-right text-muted-foreground">
                                                {c.settled_at ? money(c.refund_amount) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap text-sm space-x-2">
                                                {c.contract_file_url && (
                                                    <a href={c.contract_file_url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground underline">
                                                        ดูสัญญา
                                                    </a>
                                                )}
                                                <button onClick={() => viewHistory(c)} className="text-muted-foreground hover:text-foreground underline">ประวัติ</button>
                                                {pendingNotice && (
                                                    <button onClick={() => confirmNotice(c)} className="text-red-600 hover:text-red-800">ยืนยันย้ายออก</button>
                                                )}
                                                {noticed && (
                                                    <button onClick={() => cancelNotice(c)} className="text-amber-600 hover:text-amber-800">ยกเลิกย้ายออก</button>
                                                )}
                                                {active && (
                                                    <button onClick={() => openRenew(c)} className="text-blue-600 hover:text-blue-800">ต่อสัญญา</button>
                                                )}
                                                <button
                                                    onClick={() => openSettle(c)}
                                                    disabled={!!c.settled_at}
                                                    className="text-primary hover:text-primary/70 disabled:text-muted-foreground/40 disabled:cursor-not-allowed"
                                                >
                                                    {c.settled_at ? 'เคลียร์แล้ว' : 'เคลียร์/คืนมัดจำ'}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}

                                {contracts.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="text-center py-10 text-muted-foreground">
                                            ไม่พบสัญญา
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal เคลียร์สัญญา + คืนมัดจำ */}
            {settleContract && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-foreground mb-1">เคลียร์สัญญา + คืนมัดจำ</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            ห้อง {settleContract.room_number} · {settleContract.guest_name || '—'}
                            <span className="ml-2 text-muted-foreground">
                                (ประกัน {money(settleContract.security_deposit)} · กุญแจ {money(settleContract.key_deposit)})
                            </span>
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">วันย้ายออก</label>
                                <input
                                    type="date"
                                    value={settleForm.move_out_date}
                                    onChange={(e) => updateForm('move_out_date', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2"
                                />
                                {isForfeited && (
                                    <p className="text-xs text-red-600 mt-1">
                                        ⚠ ย้ายออกก่อนครบสัญญา ({fmt(settleContract.end_date)}) → ริบเงินประกัน
                                    </p>
                                )}
                            </div>

                            <label className="flex items-center gap-2 text-sm text-foreground">
                                <input type="checkbox" checked={settleForm.key_returned}
                                    onChange={(e) => updateForm('key_returned', e.target.checked)} />
                                คืนกุญแจ (คืนค่ามัดจำกุญแจ)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground">
                                <input type="checkbox" checked={settleForm.notice_given}
                                    onChange={(e) => updateForm('notice_given', e.target.checked)} />
                                แจ้งล่วงหน้า 30 วัน (คืนค่าเช่าส่วนเกิน)
                            </label>

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">ค่าเช่าล่วงหน้าส่วนเกินที่คืน</label>
                                <input type="number" value={settleForm.rent_refund} disabled={!settleForm.notice_given}
                                    onChange={(e) => updateForm('rent_refund', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2 disabled:bg-muted" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">ค่าเสียหาย/ซ่อม</label>
                                <input type="number" value={settleForm.damage_cost}
                                    onChange={(e) => updateForm('damage_cost', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">ค่าทำความสะอาด</label>
                                <input type="number" value={settleForm.cleaning_cost}
                                    onChange={(e) => updateForm('cleaning_cost', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">ค่าน้ำ-ไฟค้าง</label>
                                <input type="number" value={settleForm.utility_cost}
                                    onChange={(e) => updateForm('utility_cost', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">หนี้บิลค้างอื่น</label>
                                <input type="number" value={settleForm.outstanding_cost}
                                    onChange={(e) => updateForm('outstanding_cost', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2" />
                            </div>
                        </div>

                        {/* รายการหักเพิ่มเติม (อิสระ) */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-foreground">รายการหักเพิ่มเติม</label>
                                <button onClick={addExtra} className="text-sm text-primary hover:text-primary/70">+ เพิ่มรายการ</button>
                            </div>
                            {extraDeductions.map((d, i) => (
                                <div key={i} className="flex gap-2 mb-2">
                                    <input type="text" placeholder="ชื่อรายการ (เช่น ค่าซ่อมประตู)" value={d.item_name}
                                        onChange={(e) => updateExtra(i, 'item_name', e.target.value)}
                                        className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
                                    <input type="number" placeholder="จำนวนเงิน" value={d.amount}
                                        onChange={(e) => updateExtra(i, 'amount', e.target.value)}
                                        className="w-32 border border-border rounded-lg px-3 py-2 text-sm" />
                                    <button onClick={() => removeExtra(i)} className="text-red-500 px-2">✕</button>
                                </div>
                            ))}
                        </div>

                        {/* สรุปเงินคืนสุทธิ (preview) */}
                        <div className={`text-right font-semibold mt-5 mb-5 ${previewRefund() < 0 ? 'text-destructive' : 'text-foreground'}`}>
                            เงินคืนสุทธิ (โดยประมาณ): {money(previewRefund())} บาท
                            {previewRefund() < 0 && <span className="text-sm font-normal"> (ผู้เช่าต้องจ่ายเพิ่ม)</span>}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setSettleContract(null)}
                                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
                                ยกเลิก
                            </button>
                            <button onClick={handleSettle} disabled={saving}
                                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'ยืนยันเคลียร์สัญญา'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ต่อสัญญา */}
            {renewTarget && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-foreground mb-1">ต่อสัญญา</h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            ห้อง {renewTarget.room_number} · สิ้นสุดปัจจุบัน {fmt(renewTarget.end_date)}
                        </p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">ต่อออกไปอีก (เดือน)</label>
                                <input type="number" min="1" value={renewMonths}
                                    onChange={(e) => setRenewMonths(e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">แนบไฟล์สัญญาฉบับใหม่ (ถ้ามี)</label>
                                <input type="file" accept="image/*"
                                    onChange={(e) => setRenewFile(e.target.files[0] || null)}
                                    className="w-full text-sm border border-border rounded-lg px-3 py-2" />
                            </div>
                            <p className="text-xs text-muted-foreground">* ไม่เก็บมัดจำใหม่ (มัดจำเดิมยังใช้ต่อ)</p>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setRenewTarget(null)}
                                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg">ยกเลิก</button>
                            <button onClick={submitRenew} disabled={saving}
                                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'ยืนยันต่อสัญญา'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ประวัติการต่อสัญญา */}
            {historyRows !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setHistoryRows(null)}>
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-foreground">ประวัติการแก้ไข/ต่อสัญญา</h2>
                            <button onClick={() => setHistoryRows(null)} className="text-muted-foreground hover:text-foreground">✕</button>
                        </div>
                        {historyRows.length === 0 ? (
                            <p className="text-muted-foreground text-center py-6">ยังไม่มีประวัติ</p>
                        ) : (
                            <div className="space-y-3">
                                {historyRows.map((h) => (
                                    <div key={h.audit_id} className="border border-border rounded-lg p-3 text-sm">
                                        <div className="flex justify-between text-muted-foreground">
                                            <span className="font-bold">{h.action}</span>
                                            <span>{fmt(h.changed_at)} {h.changed_at?.split('T')[1]?.slice(0, 5)}</span>
                                        </div>
                                        {h.action === 'UPDATE' && h.old_data && h.new_data && (
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                {h.old_data.end_date !== h.new_data.end_date && (
                                                    <p>วันสิ้นสุด: {fmt(h.old_data.end_date)} → {fmt(h.new_data.end_date)}</p>
                                                )}
                                                {h.old_data.contract_file_url !== h.new_data.contract_file_url && (
                                                    <p>ไฟล์สัญญา: มีการเปลี่ยนแปลง</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Contracts;
