import React, { useState, useEffect } from 'react';
import BookingNavbar from '../../components/admin/BookingNavbar';
import api from '../../lib/api';

// แมป booking_status → label + สี
const STATUS_LABEL = {
    'รอชำระมัดจำ': 'รอชำระมัดจำ', 'ยืนยันการจอง': 'ยืนยันการจอง',
    'กำลังเข้าพัก': 'กำลังเข้าพัก', 'ยกเลิก': 'ยกเลิก', 'ย้ายออกแล้ว': 'ย้ายออกแล้ว',
};
const STATUS_COLOR = {
    'รอชำระมัดจำ': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'ยืนยันการจอง': 'bg-green-50 text-green-700 border-green-200',
    'กำลังเข้าพัก': 'bg-blue-50 text-blue-700 border-blue-200',
    'ยกเลิก': 'bg-red-50 text-red-700 border-red-200',
    'ย้ายออกแล้ว': 'bg-muted/30 text-muted-foreground border-border',
};

const BookingManagementDaily = () => {
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    // modal สร้างการจอง walk-in
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ full_name: '', phone_number: '', roomId: '', checkIn: '', checkOut: '' });

    // modal เช็คอิน (แนบบัตร + รูปเงินสด)
    const [checkinTarget, setCheckinTarget] = useState(null);
    const [idCard, setIdCard] = useState(null);
    const [cashPhoto, setCashPhoto] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/bookings?rentType=daily');
            if (res.data.success) setBookings(res.data.data);
        } catch {
            alert('ดึงข้อมูลการจองไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get('/getRoom');
            if (res.data.success) setRooms(res.data.data.filter((r) => r.status === 'ว่าง'));
        } catch { /* ignore */ }
    };

    useEffect(() => { fetchBookings(); fetchRooms(); }, []);

    // สร้างการจอง walk-in: สร้าง/หาสมาชิกด้วยเบอร์ก่อน แล้วสร้างการจอง
    const handleCreate = async () => {
        const { full_name, phone_number, roomId, checkIn, checkOut } = createForm;
        if (!full_name || !phone_number || !roomId || !checkIn || !checkOut) {
            alert('กรุณากรอกข้อมูลให้ครบ');
            return;
        }
        try {
            setSaving(true);
            const mRes = await api.post('/admin/quick-member', { full_name, phone_number });
            const memberId = mRes.data.memberId;
            await api.post('/admin/booking', {
                roomId: Number(roomId), userId: memberId,
                startDate: checkIn, endDate: checkOut, rentType: 'daily',
            });
            alert('สร้างการจองสำเร็จ');
            setShowCreate(false);
            setCreateForm({ full_name: '', phone_number: '', roomId: '', checkIn: '', checkOut: '' });
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'สร้างการจองไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    // เช็คอิน — บังคับแนบบัตร (+รูปเงินสดถ้า walk-in จ่ายสด)
    const handleCheckIn = async () => {
        if (!idCard) { alert('กรุณาแนบสำเนาบัตรก่อนเช็คอิน'); return; }
        try {
            setSaving(true);
            const form = new FormData();
            form.append('id_card', idCard);
            if (cashPhoto) form.append('cash_photo', cashPhoto);
            await api.put(`/admin/booking/${checkinTarget.bookingId}/checkin`, form);
            alert('เช็คอินสำเร็จ');
            setCheckinTarget(null); setIdCard(null); setCashPhoto(null);
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'เช็คอินไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    const handleCheckOut = async (id) => {
        if (!window.confirm('ยืนยันเช็คเอาท์การจองนี้?')) return;
        try {
            await api.put(`/admin/booking/${id}/checkout`, {});
            alert('เช็คเอาท์สำเร็จ');
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'เช็คเอาท์ไม่สำเร็จ');
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm('ยืนยันยกเลิกการจองนี้?')) return;
        try {
            await api.put(`/editBooking/${id}`, { status: 'ยกเลิก' });
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'ยกเลิกไม่สำเร็จ');
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-muted-foreground">กำลังโหลด...</div>;

    return (
        <div className="bg-background min-h-screen pb-10">
            <BookingNavbar />
            <div className="container mx-auto bg-card p-6 shadow-md rounded-xl mt-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-foreground">จัดการการจอง — รายวัน</h1>
                    <button onClick={() => setShowCreate(true)}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90">
                        + สร้างการจอง (walk-in)
                    </button>
                </div>

                <div className="overflow-x-auto border rounded-2xl">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted text-foreground text-xs uppercase">
                            <tr>
                                <th className="px-4 py-4 text-left font-bold">ห้อง</th>
                                <th className="px-4 py-4 text-left font-bold">ลูกค้า</th>
                                <th className="px-4 py-4 text-left font-bold">เข้าพัก — ออก</th>
                                <th className="px-4 py-4 text-left font-bold">สถานะ</th>
                                <th className="px-4 py-4 text-center font-bold">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {bookings.map((b) => (
                                <tr key={b.bookingId} className="hover:bg-muted/30">
                                    <td className="px-4 py-4 font-black text-primary">ห้อง {b.roomNumber}</td>
                                    <td className="px-4 py-4">{b.guestName || b.username || 'ไม่ระบุ'}</td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">
                                        {b.checkInDate?.split('T')[0]} | {b.checkOutDate?.split('T')[0]}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${STATUS_COLOR[b.bookingStatus] || ''}`}>
                                            {STATUS_LABEL[b.bookingStatus] || b.bookingStatus}
                                        </span>
                                        {b.hasPendingSlip && (
                                            <span className="block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 w-fit">⏳ ยังไม่ตรวจสอบสลิป</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                                            {(b.bookingStatus === 'รอชำระมัดจำ' || b.bookingStatus === 'ยืนยันการจอง') && (
                                                <button onClick={() => setCheckinTarget(b)} className="px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold">เช็คอิน</button>
                                            )}
                                            {b.bookingStatus === 'กำลังเข้าพัก' && (
                                                <button onClick={() => handleCheckOut(b.bookingId)} className="px-2 py-1 bg-muted text-foreground rounded-lg font-bold">เช็คเอาท์</button>
                                            )}
                                            {b.bookingStatus !== 'ยกเลิก' && b.bookingStatus !== 'ย้ายออกแล้ว' && (
                                                <button onClick={() => handleCancel(b.bookingId)} className="text-red-400 font-bold hover:underline">ยกเลิก</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-16 text-muted-foreground">ไม่มีการจองรายวัน</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal สร้างการจอง walk-in */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 border-b pb-4">สร้างการจองรายวัน (walk-in)</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="ชื่อ-นามสกุลลูกค้า" value={createForm.full_name}
                                onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            <input type="tel" placeholder="เบอร์โทร (ใช้เป็น username/รหัสผ่าน)" value={createForm.phone_number}
                                onChange={(e) => setCreateForm({ ...createForm, phone_number: e.target.value })}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            <select value={createForm.roomId} onChange={(e) => setCreateForm({ ...createForm, roomId: e.target.value })}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50">
                                <option value="">— เลือกห้องว่าง —</option>
                                {rooms.filter((r) => r.price != null).map((r) => (
                                    <option key={r.id} value={r.id}>ห้อง {r.number} (฿{r.price}/วัน)</option>
                                ))}
                            </select>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={createForm.checkIn} onChange={(e) => setCreateForm({ ...createForm, checkIn: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                                <input type="date" value={createForm.checkOut} onChange={(e) => setCreateForm({ ...createForm, checkOut: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setShowCreate(false)} className="px-6 py-3 text-muted-foreground font-bold hover:bg-muted rounded-xl">ยกเลิก</button>
                            <button onClick={handleCreate} disabled={saving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'สร้างการจอง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal เช็คอิน (แนบบัตร + รูปเงินสด) */}
            {checkinTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-1">เช็คอิน — ห้อง {checkinTarget.roomNumber}</h2>
                        <p className="text-sm text-muted-foreground mb-5">{checkinTarget.guestName || checkinTarget.username}</p>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">สำเนาบัตรประชาชน/นักศึกษา <span className="text-red-500">*</span></label>
                                <input type="file" accept="image/*" onChange={(e) => setIdCard(e.target.files[0] || null)}
                                    className="w-full text-sm border border-border rounded-xl p-2.5 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">รูปเงินสด (เฉพาะ walk-in จ่ายสด)</label>
                                <input type="file" accept="image/*" onChange={(e) => setCashPhoto(e.target.files[0] || null)}
                                    className="w-full text-sm border border-border rounded-xl p-2.5 bg-muted/50" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => { setCheckinTarget(null); setIdCard(null); setCashPhoto(null); }}
                                className="px-6 py-3 text-muted-foreground font-bold hover:bg-muted rounded-xl">ยกเลิก</button>
                            <button onClick={handleCheckIn} disabled={saving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'ยืนยันเช็คอิน'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagementDaily;
