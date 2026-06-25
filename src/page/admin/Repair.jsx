import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';

// แมป status ในฐานข้อมูล → label และสีที่แสดงใน UI
const STATUS_CONFIG = {
    pending:     { label: 'รอตรวจสอบ',      color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-800' },
    done:        { label: 'เสร็จสิ้น',       color: 'bg-green-100 text-green-800' },
};

const renderStatusBadge = (status) => {
    const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-muted text-foreground' };
    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.color}`}>
            {cfg.label}
        </span>
    );
};

const Repair = () => {
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

    // repair ที่เปิด modal อยู่ + สถานะที่กำลังจะบันทึก
    const [selectedRepair, setSelectedRepair] = useState(null);
    const [newStatus, setNewStatus] = useState('');
    const [saving, setSaving] = useState(false);

    // ==========================================
    // โหลดรายการแจ้งซ่อมทั้งหมดจาก API
    // ==========================================
    const fetchRepairs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/repairs');
            if (res.data.success) {
                setRepairs(res.data.data);
            }
        } catch (err) {
            console.error('โหลดข้อมูลแจ้งซ่อมไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRepairs();
    }, []);

    // กรองรายการตามช่วงวันที่
    const filteredRepairs = useMemo(() => {
        const { startDate, endDate } = dateRange;
        if (!startDate && !endDate) return repairs;
        return repairs.filter((r) => {
            const date = r.reported_date.split('T')[0];
            if (startDate && !endDate) return date >= startDate;
            if (!startDate && endDate) return date <= endDate;
            return date >= startDate && date <= endDate;
        });
    }, [repairs, dateRange]);

    // ==========================================
    // เปิด/ปิด modal รายละเอียด
    // ==========================================
    const openDetail = (repair) => {
        setSelectedRepair(repair);
        setNewStatus(repair.status);
    };

    const closeModal = () => {
        setSelectedRepair(null);
        setNewStatus('');
    };

    // ==========================================
    // อัปเดตสถานะผ่าน API
    // ==========================================
    const handleUpdateStatus = async () => {
        if (!selectedRepair) return;

        // ถ้าสถานะไม่เปลี่ยน ปิด modal เฉยๆ
        if (newStatus === selectedRepair.status) {
            closeModal();
            return;
        }

        try {
            setSaving(true);
            const res = await api.put(`/repair/${selectedRepair.repair_id}`, { status: newStatus });
            if (res.data.success) {
                // อัปเดต state local โดยไม่ต้อง refetch ทั้งหมด
                setRepairs(prev =>
                    prev.map(r =>
                        r.repair_id === selectedRepair.repair_id ? { ...r, status: newStatus } : r
                    )
                );
                closeModal();
            }
        } catch (err) {
            console.error('อัปเดตสถานะไม่สำเร็จ:', err);
            alert('เกิดข้อผิดพลาด ไม่สามารถอัปเดตสถานะได้');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="flex w-full flex-col bg-background p-6">

                {/* ส่วนหัว + ตัวกรองวันที่ */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">รายงานการแจ้งซ่อม</h1>
                    <div className="flex flex-wrap items-center space-x-3">
                        <label className="text-sm font-medium text-foreground ml-2">จาก:</label>
                        <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="border-border rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                        />
                        <label className="text-sm font-medium text-foreground ml-2">ถึง:</label>
                        <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="border-border rounded-lg shadow-sm focus:border-primary focus:ring-primary"
                        />
                        {(dateRange.startDate || dateRange.endDate) && (
                            <button
                                onClick={() => setDateRange({ startDate: '', endDate: '' })}
                                className="bg-muted hover:bg-muted/80 text-foreground text-sm font-bold py-2 px-3 rounded-lg transition duration-300"
                            >
                                ล้าง
                            </button>
                        )}
                    </div>
                </div>

                {/* ตารางรายการแจ้งซ่อม */}
                <div className="bg-card shadow-md rounded-lg overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-border">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">วันที่แจ้ง</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ห้อง</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ผู้แจ้ง</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">หัวข้อปัญหา</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">สถานะ</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">ดำเนินการ</th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {filteredRepairs.map((r) => (
                                    <tr key={r.repair_id} className="hover:bg-muted/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{r.reported_date.split('T')[0]}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">{r.room_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-foreground">{r.tenant_name || 'ไม่ระบุ'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-foreground max-w-xs truncate">{r.problem_title}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(r.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => openDetail(r)}
                                                className="text-primary hover:text-primary/70 mr-2 transition duration-300"
                                            >
                                                ดูรายละเอียด
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {filteredRepairs.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="text-center py-10 text-muted-foreground">
                                            ไม่พบรายการแจ้งซ่อมในช่วงวันที่ที่เลือก
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal รายละเอียด + อัปเดตสถานะ */}
            {selectedRepair && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold text-foreground mb-4">รายละเอียดการแจ้งซ่อม</h2>

                        <div className="space-y-3 mb-5">
                            <div>
                                <span className="text-sm text-muted-foreground">ห้อง: </span>
                                <span className="text-sm font-medium">{selectedRepair.room_number}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">ผู้แจ้ง: </span>
                                <span className="text-sm font-medium">{selectedRepair.tenant_name || 'ไม่ระบุ'}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">วันที่แจ้ง: </span>
                                <span className="text-sm">{selectedRepair.reported_date.split('T')[0]}</span>
                            </div>
                            <div>
                                <span className="text-sm text-muted-foreground">หัวข้อ: </span>
                                <span className="text-sm font-medium">{selectedRepair.problem_title}</span>
                            </div>
                            {selectedRepair.problem_details && (
                                <div>
                                    <div className="text-sm text-muted-foreground mb-1">รายละเอียด:</div>
                                    <div className="text-sm bg-muted/50 p-3 rounded-lg">{selectedRepair.problem_details}</div>
                                </div>
                            )}
                        </div>

                        {/* เปลี่ยนสถานะ */}
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-foreground mb-1">สถานะ</label>
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="pending">รอตรวจสอบ</option>
                                <option value="in_progress">กำลังดำเนินการ</option>
                                <option value="done">เสร็จสิ้น</option>
                            </select>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
                            >
                                ปิด
                            </button>
                            <button
                                onClick={handleUpdateStatus}
                                disabled={saving}
                                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Repair;
