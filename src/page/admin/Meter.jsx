import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// คืนค่า 'YYYY-MM' ของเดือนปัจจุบัน
function getCurrentMonth() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
}

const Meter = () => {
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [meters, setMeters] = useState([]);
    const [loading, setLoading] = useState(false);

    // modal บันทึก/แก้ไขมิเตอร์
    const [modalRoom, setModalRoom] = useState(null);
    const [form, setForm] = useState({ water_current_unit: '', elec_current_unit: '' });
    const [saving, setSaving] = useState(false);

    // ==========================================
    // โหลดข้อมูลมิเตอร์ทุกห้องในเดือนที่เลือก
    // ==========================================
    const fetchMeters = async (month) => {
        try {
            setLoading(true);
            const res = await api.get(`/meters?month=${month}`);
            if (res.data.success) {
                setMeters(res.data.data);
            }
        } catch (err) {
            console.error('โหลดข้อมูลมิเตอร์ไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMeters(selectedMonth);
    }, [selectedMonth]);

    // ==========================================
    // เปิด modal — ถ้ามีข้อมูลแล้วให้แสดงค่าเดิม
    // ==========================================
    const openModal = (room) => {
        setModalRoom(room);
        setForm({
            water_current_unit: room.water_current != null ? String(room.water_current) : '',
            elec_current_unit:  room.elec_current  != null ? String(room.elec_current)  : '',
        });
    };

    const closeModal = () => {
        setModalRoom(null);
        setForm({ water_current_unit: '', elec_current_unit: '' });
    };

    // ==========================================
    // บันทึกมิเตอร์ผ่าน API
    // ==========================================
    const handleSave = async () => {
        const water = parseInt(form.water_current_unit, 10);
        const elec  = parseInt(form.elec_current_unit, 10);

        if (isNaN(water) || isNaN(elec) || water < 0 || elec < 0) {
            alert('กรุณากรอกหน่วยมิเตอร์เป็นตัวเลขที่ไม่ติดลบ');
            return;
        }

        try {
            setSaving(true);
            const res = await api.post('/meter', {
                    room_id:            modalRoom.room_id,
                    record_month:       selectedMonth,
                    water_current_unit: water,
                    elec_current_unit:  elec,
            });
            if (res.data.success) {
                closeModal();
                fetchMeters(selectedMonth); // โหลดใหม่เพื่อแสดง diff ที่คำนวณแล้ว
            }
        } catch (err) {
            console.error('บันทึกมิเตอร์ไม่สำเร็จ:', err);
            alert('เกิดข้อผิดพลาด ไม่สามารถบันทึกมิเตอร์ได้');
        } finally {
            setSaving(false);
        }
    };

    // ==========================================
    // helper แสดงตัวเลข — null แสดงเป็น '—'
    // ==========================================
    const fmt = (val, unit = '') => val != null ? `${val.toLocaleString()}${unit}` : '—';

    return (
        <>
            <div className="flex w-full flex-col bg-background p-6">

                {/* ส่วนหัว + เลือกเดือน + badge อัตราค่า */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-foreground">บันทึกมิเตอร์น้ำ-ไฟ</h1>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* badge อัตราค่า */}
                        {meters.length > 0 && (
                            <div className="flex gap-2 text-xs">
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                    น้ำ {meters[0].water_rate} บ./หน่วย
                                </span>
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                    ไฟ {meters[0].elec_rate} บ./หน่วย
                                </span>
                            </div>
                        )}
                        <label className="text-sm font-medium text-foreground">เดือน:</label>
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                {/* ตารางมิเตอร์ */}
                <div className="bg-card shadow-md rounded-lg overflow-x-auto">
                    {loading ? (
                        <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <table className="min-w-full divide-y divide-border text-sm">
                            <thead className="bg-muted">
                                <tr>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ห้อง</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider" colSpan={3}>
                                        น้ำ (หน่วย)
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider">
                                        ค่าน้ำ (บ.)
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider" colSpan={3}>
                                        ไฟ (หน่วย)
                                    </th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider">
                                        ค่าไฟ (บ.)
                                    </th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">บันทึกโดย</th>
                                    <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider">ดำเนินการ</th>
                                </tr>
                                <tr className="bg-muted/50 text-xs text-muted-foreground">
                                    <th></th>
                                    <th className="px-4 py-1 text-center">เดือนก่อน</th>
                                    <th className="px-4 py-1 text-center">เดือนนี้</th>
                                    <th className="px-4 py-1 text-center">ใช้ไป</th>
                                    <th></th>
                                    <th className="px-4 py-1 text-center">เดือนก่อน</th>
                                    <th className="px-4 py-1 text-center">เดือนนี้</th>
                                    <th className="px-4 py-1 text-center">ใช้ไป</th>
                                    <th></th>
                                    <th></th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody className="bg-card divide-y divide-border">
                                {meters.map((row) => (
                                    <tr key={row.room_id} className="hover:bg-muted/50">

                                        {/* ห้อง */}
                                        <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                                            {row.room_number}
                                            {row.room_status === 'ว่าง' && (
                                                <span className="ml-1 text-xs text-muted-foreground">(ว่าง)</span>
                                            )}
                                        </td>

                                        {/* น้ำ — เดือนก่อน / ปัจจุบัน / ใช้ไป */}
                                        <td className="px-4 py-3 text-center text-muted-foreground">{fmt(row.prev_water)}</td>
                                        <td className="px-4 py-3 text-center font-medium text-foreground">{fmt(row.water_current)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.diff_water != null ? (
                                                <span className="text-blue-700 font-semibold">{row.diff_water}</span>
                                            ) : '—'}
                                        </td>

                                        {/* ค่าน้ำ */}
                                        <td className="px-4 py-3 text-center text-blue-600 font-medium">
                                            {row.water_cost != null ? row.water_cost.toLocaleString() : '—'}
                                        </td>

                                        {/* ไฟ — เดือนก่อน / ปัจจุบัน / ใช้ไป */}
                                        <td className="px-4 py-3 text-center text-muted-foreground">{fmt(row.prev_elec)}</td>
                                        <td className="px-4 py-3 text-center font-medium text-foreground">{fmt(row.elec_current)}</td>
                                        <td className="px-4 py-3 text-center">
                                            {row.diff_elec != null ? (
                                                <span className="text-yellow-700 font-semibold">{row.diff_elec}</span>
                                            ) : '—'}
                                        </td>

                                        {/* ค่าไฟ */}
                                        <td className="px-4 py-3 text-center text-yellow-600 font-medium">
                                            {row.elec_cost != null ? row.elec_cost.toLocaleString() : '—'}
                                        </td>

                                        {/* บันทึกโดย */}
                                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                            {row.recorded_by_name || '—'}
                                        </td>

                                        {/* ปุ่ม */}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => openModal(row)}
                                                className={`text-sm font-medium transition duration-200 ${
                                                    row.meter_id
                                                        ? 'text-primary hover:text-primary/70'
                                                        : 'text-green-600 hover:text-green-900'
                                                }`}
                                            >
                                                {row.meter_id ? 'แก้ไข' : 'บันทึก'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {meters.length === 0 && (
                                    <tr>
                                        <td colSpan="11" className="text-center py-10 text-muted-foreground">
                                            ไม่พบข้อมูลห้องพัก
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal บันทึก/แก้ไขมิเตอร์ */}
            {modalRoom && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold text-foreground mb-1">
                            {modalRoom.meter_id ? 'แก้ไข' : 'บันทึก'}มิเตอร์
                        </h2>
                        <p className="text-sm text-muted-foreground mb-5">
                            ห้อง {modalRoom.room_number} · เดือน {selectedMonth}
                        </p>

                        {/* หน่วยน้ำ */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                หน่วยน้ำปัจจุบัน
                                {modalRoom.prev_water != null && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                        (เดือนก่อน: {modalRoom.prev_water})
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.water_current_unit}
                                onChange={(e) => setForm(prev => ({ ...prev, water_current_unit: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="กรอกหน่วยน้ำ"
                            />
                        </div>

                        {/* หน่วยไฟ */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-foreground mb-1">
                                หน่วยไฟปัจจุบัน
                                {modalRoom.prev_elec != null && (
                                    <span className="ml-2 text-xs text-muted-foreground font-normal">
                                        (เดือนก่อน: {modalRoom.prev_elec})
                                    </span>
                                )}
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={form.elec_current_unit}
                                onChange={(e) => setForm(prev => ({ ...prev, elec_current_unit: e.target.value }))}
                                className="w-full border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                placeholder="กรอกหน่วยไฟ"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Meter;
