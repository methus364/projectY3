import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// สีป้ายชนิดการกระทำ
const actionBadge = (action) => {
    if (action === 'INSERT') return 'bg-green-100 text-green-800';
    if (action === 'UPDATE') return 'bg-blue-100 text-blue-800';
    if (action === 'DELETE') return 'bg-red-100 text-red-800';
    return 'bg-muted text-foreground';
};
const actionLabel = (action) => {
    if (action === 'INSERT') return 'เพิ่ม';
    if (action === 'UPDATE') return 'แก้ไข';
    if (action === 'DELETE') return 'ลบ';
    return action;
};

// ตัวเลือกตารางให้ filter (ตรงกับ TABLE_LABELS ฝั่ง server)
const TABLE_OPTIONS = [
    { value: '', label: 'ทุกตาราง' },
    { value: 'invoices', label: 'ใบแจ้งหนี้' },
    { value: 'payments', label: 'การชำระเงิน' },
    { value: 'contracts', label: 'สัญญาเช่า' },
    { value: 'bookings', label: 'การจอง' },
    { value: 'members', label: 'ผู้ใช้' },
    { value: 'products', label: 'สินค้า' },
    { value: 'sales', label: 'การขาย' },
];

const AuditLogs = () => {
    const [tableFilter, setTableFilter] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null); // log ที่กดดูข้อมูลก่อน/หลัง

    // ==========================================
    // โหลด audit log ตาม filter
    // ==========================================
    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (tableFilter) params.append('table', tableFilter);
            if (actionFilter) params.append('action', actionFilter);
            const res = await api.get(`/audit-logs?${params.toString()}`);
            if (res.data.success) setLogs(res.data.data);
        } catch (err) {
            console.error('โหลด audit log ไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [tableFilter, actionFilter]);

    const formatTime = (t) => new Date(t).toLocaleString('th-TH');

    return (
        <>
            <div className="flex w-full flex-col bg-background p-6">

                {/* ส่วนหัว + filter */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">ประวัติการเปลี่ยนแปลง</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={tableFilter}
                            onChange={(e) => setTableFilter(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {TABLE_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="">ทุกการกระทำ</option>
                            <option value="INSERT">เพิ่ม</option>
                            <option value="UPDATE">แก้ไข</option>
                            <option value="DELETE">ลบ</option>
                        </select>
                    </div>
                </div>

                {/* ตาราง log */}
                <div className="bg-card shadow-md rounded-lg overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">เวลา</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ตาราง</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">การกระทำ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">รหัสแถว</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ผู้ทำ</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ดู</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {logs.map((log) => (
                                    <tr key={log.audit_id} className="hover:bg-muted/50">
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatTime(log.changed_at)}</td>
                                        <td className="px-4 py-3 text-foreground">{log.table_label}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionBadge(log.action)}`}>
                                                {actionLabel(log.action)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{log.record_id ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{log.changed_by_name || '— (ระบบ)'}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button onClick={() => setDetail(log)} className="text-sm text-primary hover:text-primary/70">
                                                ดูข้อมูล
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-muted-foreground">
                                            ไม่พบประวัติการเปลี่ยนแปลง
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal ดูข้อมูลก่อน/หลัง (JSON) */}
            {detail && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-foreground mb-1">
                            {detail.table_label} · {actionLabel(detail.action)} · แถว {detail.record_id ?? '—'}
                        </h2>
                        <p className="text-sm text-muted-foreground mb-5">
                            {formatTime(detail.changed_at)} · โดย {detail.changed_by_name || '— (ระบบ)'}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-2">ก่อนแก้ (old)</h3>
                                <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                                    {detail.old_data ? JSON.stringify(detail.old_data, null, 2) : '—'}
                                </pre>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-2">หลังแก้ (new)</h3>
                                <pre className="bg-muted/50 border border-border rounded-lg p-3 text-xs overflow-x-auto whitespace-pre-wrap">
                                    {detail.new_data ? JSON.stringify(detail.new_data, null, 2) : '—'}
                                </pre>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                            <button onClick={() => setDetail(null)} className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition">
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AuditLogs;
