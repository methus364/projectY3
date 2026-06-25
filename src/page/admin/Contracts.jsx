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
    const [saving, setSaving] = useState(false);

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
    // เปิด modal เคลียร์สัญญา
    // ==========================================
    const openSettle = (contract) => {
        setSettleContract(contract);
        setSettleForm({ ...emptySettle, move_out_date: new Date().toISOString().split('T')[0] });
    };

    const updateForm = (field, value) => {
        setSettleForm((prev) => ({ ...prev, [field]: value }));
    };

    // คำนวณเงินคืนฝั่ง client เพื่อแสดง preview (server จะคำนวณซ้ำตอนบันทึก)
    // ออกก่อนครบสัญญา = ริบประกัน · คืนค่าเช่าล่วงหน้าเฉพาะแจ้งล่วงหน้า
    const previewRefund = () => {
        if (!settleContract) return 0;
        const security = Number(settleContract.security_deposit) || 0;
        const key = Number(settleContract.key_deposit) || 0;
        const forfeited = settleForm.move_out_date && new Date(settleForm.move_out_date) < new Date(settleContract.end_date);

        const rentRefund = settleForm.notice_given ? (Number(settleForm.rent_refund) || 0) : 0;
        const securityBack = forfeited ? 0 : security;
        const keyBack = settleForm.key_returned ? key : 0;
        const deductions =
            (Number(settleForm.damage_cost) || 0) +
            (Number(settleForm.cleaning_cost) || 0) +
            (Number(settleForm.utility_cost) || 0) +
            (Number(settleForm.outstanding_cost) || 0);

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
            const res = await api.post(`/contract/${settleContract.contract_id}/settle`, settleForm);
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
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ประกัน</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">กุญแจ</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">สถานะ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">เงินคืน</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {contracts.map((c) => (
                                    <tr key={c.contract_id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            CT-{String(c.contract_id).padStart(4, '0')}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{c.room_number}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{c.guest_name || '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {c.start_date?.split('T')[0]} → {c.end_date?.split('T')[0]}
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{money(c.security_deposit)}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{money(c.key_deposit)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(c.contract_status)}`}>
                                                {c.contract_status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">
                                            {c.settled_at ? money(c.refund_amount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            {/* เคลียร์ได้เฉพาะสัญญาที่ยังไม่ปิด */}
                                            <button
                                                onClick={() => openSettle(c)}
                                                disabled={!!c.settled_at}
                                                className="text-sm text-primary hover:text-primary/70 disabled:text-muted-foreground/40 disabled:cursor-not-allowed"
                                            >
                                                {c.settled_at ? 'เคลียร์แล้ว' : 'เคลียร์/คืนมัดจำ'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {contracts.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10 text-muted-foreground">
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
                                        ⚠ ย้ายออกก่อนครบสัญญา ({settleContract.end_date?.split('T')[0]}) → ริบเงินประกัน
                                    </p>
                                )}
                            </div>

                            {/* checkbox เงื่อนไขคืนเงิน */}
                            <label className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={settleForm.key_returned}
                                    onChange={(e) => updateForm('key_returned', e.target.checked)}
                                />
                                คืนกุญแจ (คืนค่ามัดจำกุญแจ)
                            </label>
                            <label className="flex items-center gap-2 text-sm text-foreground">
                                <input
                                    type="checkbox"
                                    checked={settleForm.notice_given}
                                    onChange={(e) => updateForm('notice_given', e.target.checked)}
                                />
                                แจ้งล่วงหน้า 30 วัน (คืนค่าเช่าส่วนเกิน)
                            </label>

                            {/* ค่าเช่าล่วงหน้าส่วนเกิน — กรอกได้เฉพาะเมื่อแจ้งล่วงหน้า */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    ค่าเช่าล่วงหน้าส่วนเกินที่คืน
                                </label>
                                <input
                                    type="number"
                                    value={settleForm.rent_refund}
                                    disabled={!settleForm.notice_given}
                                    onChange={(e) => updateForm('rent_refund', e.target.value)}
                                    className="w-full border border-border rounded-lg px-3 py-2 disabled:bg-muted"
                                />
                            </div>

                            {/* ค่าใช้จ่ายที่หักออก */}
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
        </>
    );
};

export default Contracts;
