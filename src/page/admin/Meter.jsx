import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// ชื่อย่อเดือนไทย เรียงตามลำดับ (index 0 = ม.ค.) ใช้ทำหัวคอลัมน์
const THAI_MONTH_SHORT = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

// ตัวเลือกปี (ค.ศ.) — ย้อนหลัง 3 ปี ถึงปีหน้า · แสดงผลเป็น พ.ศ.
function getYearOptions() {
    const nowYear = new Date().getFullYear();
    const years = [];
    for (let y = nowYear - 3; y <= nowYear + 1; y++) {
        years.push(y);
    }
    return years;
}

const Meter = () => {
    const [year, setYear] = useState(new Date().getFullYear()); // ค.ศ.
    const [activeTab, setActiveTab] = useState('water');         // 'water' | 'elec'

    const [rooms, setRooms] = useState([]);   // [{ room_id, room_number, room_status, readings }]
    const [months, setMonths] = useState([]); // ['YYYY-01', ... 'YYYY-12']
    const [rates, setRates] = useState({ water: 0, elec: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // การแก้ไข inline — แก้ได้ทีละช่อง (เหมือน Excel)
    const [editing, setEditing] = useState(null); // { roomId, month } หรือ null
    const [editValue, setEditValue] = useState('');

    // ==========================================
    // โหลดข้อมูลมิเตอร์ทั้งปี
    // ==========================================
    const fetchYear = async (yearCE) => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get(`/meters/year?year=${yearCE}`);
            if (res.data.success) {
                setRooms(res.data.data);
                setMonths(res.data.months);
                setRates({ water: res.data.water_rate, elec: res.data.elec_rate });
            }
        } catch (err) {
            console.error('โหลดข้อมูลมิเตอร์ไม่สำเร็จ:', err);
            setError('โหลดข้อมูลมิเตอร์ไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchYear(year);
    }, [year]);

    // ==========================================
    // อ่านค่ามิเตอร์ของช่อง (ห้อง + เดือน + แท็บที่เลือก)
    // ==========================================
    const getCell = (room, month) => {
        const reading = room.readings[month];
        if (!reading) return null;
        return reading[activeTab]; // .water หรือ .elec
    };

    // ==========================================
    // เริ่มแก้ไขช่อง — เอาค่าเดิมมาใส่ในกล่อง
    // ==========================================
    const startEdit = (room, month) => {
        const value = getCell(room, month);
        setEditing({ roomId: room.room_id, month });
        setEditValue(value != null ? String(value) : '');
    };

    const cancelEdit = () => {
        setEditing(null);
        setEditValue('');
    };

    // ==========================================
    // อัปเดตค่าในหน่วยความจำแบบ optimistic (ไม่ต้องโหลดใหม่ทั้งตาราง)
    // ==========================================
    const updateLocalReading = (roomId, month, value) => {
        setRooms((prev) => prev.map((r) => {
            if (r.room_id !== roomId) return r;
            const readings = { ...r.readings };
            const cell = { ...(readings[month] || { water: null, elec: null, meter_id: null }) };
            cell[activeTab] = value;
            readings[month] = cell;
            return { ...r, readings };
        }));
    };

    // ==========================================
    // บันทึกช่องที่แก้ — ส่งเฉพาะฝั่งน้ำหรือไฟตามแท็บที่เลือก
    // ==========================================
    const commitEdit = async (room, month) => {
        const raw = editValue.trim();
        const current = getCell(room, month);
        cancelEdit();

        if (raw === '') return; // ไม่กรอกอะไร = ไม่บันทึก
        const value = parseInt(raw, 10);
        if (isNaN(value) || value < 0) {
            alert('กรุณากรอกเลขมิเตอร์เป็นจำนวนเต็มที่ไม่ติดลบ');
            return;
        }
        if (current != null && value === current) return; // ค่าเท่าเดิม ไม่ต้องบันทึก

        // อัปเดตหน้าจอทันที แล้วค่อยยิง API (ถ้าพลาดค่อยดึงค่าจริงกลับมา)
        updateLocalReading(room.room_id, month, value);
        try {
            const field = activeTab === 'water' ? 'water_current_unit' : 'elec_current_unit';
            await api.post('/meter', {
                room_id: room.room_id,
                record_month: month,
                [field]: value,
            });
        } catch (err) {
            const msg = err.response?.data?.message || 'บันทึกมิเตอร์ไม่สำเร็จ';
            alert(msg);
            fetchYear(year); // ดึงค่าจริงกลับมาแทนค่าที่ optimistic ไว้
        }
    };

    // กด Enter = บันทึก, Esc = ยกเลิก
    const handleKeyDown = (e, room, month) => {
        if (e.key === 'Enter') commitEdit(room, month);
        else if (e.key === 'Escape') cancelEdit();
    };

    return (
        <div className="flex w-full flex-col bg-background p-6">

            {/* ส่วนหัว + เลือกปี */}
            <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                <h1 className="text-3xl font-bold text-foreground">บันทึกมิเตอร์น้ำ-ไฟ</h1>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-foreground">ปี พ.ศ.:</label>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-border rounded-lg px-3 py-1.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        {getYearOptions().map((y) => (
                            <option key={y} value={y}>{y + 543}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* แท็บน้ำ / ไฟ */}
            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('water')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        activeTab === 'water'
                            ? 'bg-blue-600 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    น้ำ ({rates.water} บ./หน่วย)
                </button>
                <button
                    onClick={() => setActiveTab('elec')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
                        activeTab === 'elec'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                    ไฟ ({rates.elec} บ./หน่วย)
                </button>
                <span className="ml-2 text-xs text-muted-foreground">
                    คลิกช่องเพื่อกรอก/แก้เลขมิเตอร์ (Enter = บันทึก, Esc = ยกเลิก)
                </span>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* ตารางกริด: แถว = ห้อง, คอลัมน์ = เดือน */}
            <div className="bg-card shadow-md rounded-lg overflow-x-auto">
                {loading ? (
                    <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
                ) : (
                    <table className="min-w-full border-collapse text-sm">
                        <thead className="bg-muted">
                            <tr>
                                {/* คอลัมน์ห้อง — ตรึงซ้ายไว้ตอนเลื่อนแนวนอน */}
                                <th className="sticky left-0 z-10 bg-muted px-4 py-3 text-left font-medium text-muted-foreground border-r border-border">
                                    ห้อง
                                </th>
                                {months.map((m, idx) => (
                                    <th key={m} className="px-3 py-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                                        {THAI_MONTH_SHORT[idx]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {rooms.map((room) => (
                                <tr key={room.room_id} className="hover:bg-muted/30">
                                    {/* ห้อง (ตรึงซ้าย) */}
                                    <td className="sticky left-0 z-10 bg-card px-4 py-2 font-medium text-foreground whitespace-nowrap border-r border-border">
                                        {room.room_number}
                                    </td>

                                    {/* ช่องเลขมิเตอร์รายเดือน */}
                                    {months.map((month) => {
                                        const isEditing = editing && editing.roomId === room.room_id && editing.month === month;
                                        const value = getCell(room, month);
                                        return (
                                            <td key={month} className="px-1 py-1 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        autoFocus
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, room, month)}
                                                        onBlur={() => commitEdit(room, month)}
                                                        className="w-20 text-center border border-primary rounded px-1 py-1 focus:outline-none focus:ring-2 focus:ring-primary"
                                                    />
                                                ) : (
                                                    <button
                                                        onClick={() => startEdit(room, month)}
                                                        className={`w-20 rounded px-1 py-1 hover:bg-muted transition ${
                                                            value != null ? 'font-medium text-blue-700' : 'text-muted-foreground'
                                                        }`}
                                                    >
                                                        {value != null ? value.toLocaleString() : '—'}
                                                    </button>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}

                            {rooms.length === 0 && (
                                <tr>
                                    <td colSpan={months.length + 1} className="text-center py-10 text-muted-foreground">
                                        ไม่พบข้อมูลห้องพัก
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Meter;
