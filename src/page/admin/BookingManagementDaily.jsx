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
    const [availableToday, setAvailableToday] = useState([]); // ห้องว่างของวันนี้ (เช็ค overlap การจองจริง)
    const [loading, setLoading] = useState(true);

    // modal สร้างการจอง walk-in
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ full_name: '', phone_number: '', roomId: '', checkIn: '', checkOut: '' });

    // modal เช็คอิน (แนบบัตร + รูปเงินสด)
    const [checkinTarget, setCheckinTarget] = useState(null);
    const [idCard, setIdCard] = useState(null);
    const [cashPhoto, setCashPhoto] = useState(null);
    const [saving, setSaving] = useState(false);

    // modal ตรวจสอบสลิป + ข้อมูลลูกค้า
    const [verifyTarget, setVerifyTarget] = useState(null);

    // ค้นหา + แท็บกรองสถานะ (ทั้งหมด / เช็คอินวันนี้ / เช็คเอาท์วันนี้ / กำลังเข้าพัก)
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState(''); // กรองการจองที่ครอบคลุมวันที่นี้
    const today = new Date().toISOString().split('T')[0];

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/bookings?rentType=daily');
            if (res.data.success) {
                setBookings(res.data.data);
                return res.data.data;
            }
        } catch {
            alert('ดึงข้อมูลการจองไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
        return [];
    };

    // ดึงข้อมูลล่าสุดก่อนเปิดโมดัล กันกรณีลูกค้าเพิ่งแนบสลิปมาหลังหน้านี้โหลดไปแล้ว
    const openVerifyModal = async (booking) => {
        const fresh = await fetchBookings();
        setVerifyTarget(fresh.find((b) => b.bookingId === booking.bookingId) || booking);
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get('/getRoom');
            if (res.data.success) setRooms(res.data.data.filter((r) => r.status === 'ว่าง'));
        } catch { /* ignore */ }
    };

    // ห้องว่างจริงของวันนี้ (เช็ค overlap การจองแล้ว ไม่ใช่แค่ room_status)
    const fetchAvailabilityToday = async () => {
        try {
            const todayDate = new Date().toISOString().split('T')[0];
            const res = await api.get(`/rooms/availability?date=${todayDate}`);
            if (res.data.success) setAvailableToday(res.data.data.filter((r) => r.available));
        } catch { /* ignore */ }
    };

    useEffect(() => { fetchBookings(); fetchRooms(); fetchAvailabilityToday(); }, []);

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

    // ยืนยัน/ปฏิเสธสลิปที่รอตรวจ ของการจองที่เปิดโมดัลอยู่
    const handleVerifySlip = async (action) => {
        try {
            setSaving(true);
            await api.put(`/payment/${verifyTarget.latestPaymentId}/verify`, { action });
            alert(action === 'approve' ? 'ยืนยันการชำระเงินสำเร็จ' : 'ปฏิเสธการชำระเงินแล้ว');
            setVerifyTarget(null);
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'ดำเนินการไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold text-muted-foreground">กำลังโหลด...</div>;

    // กรองตามคำค้นหา + แท็บสถานะ
    const filteredBookings = bookings.filter((b) => {
        const matchesSearch =
            (b.guestName || b.username || '').toLowerCase().includes(search.toLowerCase()) ||
            String(b.roomNumber).includes(search);
        if (!matchesSearch) return false;

        if (dateFilter) {
            const checkIn = b.checkInDate?.split('T')[0];
            const checkOut = b.checkOutDate?.split('T')[0];
            if (!(checkIn <= dateFilter && dateFilter <= checkOut)) return false;
        }

        if (statusFilter === 'arrivals') return b.checkInDate?.split('T')[0] === today;
        if (statusFilter === 'departures') return b.checkOutDate?.split('T')[0] === today;
        if (statusFilter === 'inhouse') return b.bookingStatus === 'กำลังเข้าพัก';
        return true;
    });

    // สรุปยอดสำหรับการ์ดด้านขวา
    const arrivalsToday = bookings.filter((b) => b.checkInDate?.split('T')[0] === today).length;
    const departuresToday = bookings.filter((b) => b.checkOutDate?.split('T')[0] === today).length;
    const totalGuests = bookings.filter((b) => b.bookingStatus === 'กำลังเข้าพัก').length;

    // นับห้องว่างวันนี้แยกตามประเภทห้อง
    const availableByType = availableToday.reduce((acc, r) => {
        const type = r.type_name || 'ไม่ระบุประเภท';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {});
    const availableRoomsCount = availableToday.length;

    const STATUS_TABS = [
        { key: 'all', label: 'ทั้งหมด' },
        { key: 'arrivals', label: 'เช็คอินวันนี้' },
        { key: 'departures', label: 'เช็คเอาท์วันนี้' },
        { key: 'inhouse', label: 'กำลังเข้าพัก' },
    ];

    return (
        <div className="bg-background min-h-screen pb-10">
            <BookingNavbar />
            <div className="container mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-black text-foreground">จัดการการจอง — รายวัน</h1>
                    <button onClick={() => setShowCreate(true)}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-bold hover:bg-primary/90">
                        + สร้างการจอง (walk-in)
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* คอลัมน์ซ้าย: ค้นหา + แท็บสถานะ + รายการจอง */}
                    <div className="lg:col-span-2 bg-card p-6 shadow-md rounded-xl">
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <input
                                type="text"
                                placeholder="ค้นหาชื่อลูกค้า หรือเลขห้อง..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50"
                            />
                            <input
                                type="date"
                                value={dateFilter}
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="border border-border rounded-xl p-3 bg-muted/50 sm:w-52"
                            />
                            {dateFilter && (
                                <button
                                    type="button"
                                    onClick={() => setDateFilter('')}
                                    className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-muted rounded-xl"
                                >
                                    ล้างวันที่
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-5">
                            {STATUS_TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setStatusFilter(tab.key)}
                                    className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusFilter === tab.key
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="divide-y divide-border">
                            {filteredBookings.map((b) => (
                                <div key={b.bookingId} className="py-4 flex flex-wrap items-center justify-between gap-3">
                                    <div className="min-w-[140px]">
                                        <p className="font-black text-primary">ห้อง {b.roomNumber}</p>
                                        <p className="text-sm text-muted-foreground truncate">{b.guestName || b.username || 'ไม่ระบุ'}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {b.checkInDate?.split('T')[0]} — {b.checkOutDate?.split('T')[0]}
                                    </div>
                                    <div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${STATUS_COLOR[b.bookingStatus] || ''}`}>
                                            {STATUS_LABEL[b.bookingStatus] || b.bookingStatus}
                                        </span>
                                        {b.hasPendingSlip && (
                                            <span className="block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 w-fit">⏳ รอตรวจสลิป</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                        <button onClick={() => openVerifyModal(b)} className="px-3 py-1.5 bg-blue-500 text-white rounded-lg font-bold">
                                            ดูข้อมูลผู้เข้าพัก
                                        </button>
                                        {(b.bookingStatus === 'รอชำระมัดจำ' || b.bookingStatus === 'ยืนยันการจอง') && (
                                            <button onClick={() => setCheckinTarget(b)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg font-bold">เช็คอิน</button>
                                        )}
                                        {b.bookingStatus === 'กำลังเข้าพัก' && (
                                            <button onClick={() => handleCheckOut(b.bookingId)} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg font-bold">เช็คเอาท์</button>
                                        )}
                                        {b.bookingStatus !== 'ยกเลิก' && b.bookingStatus !== 'ย้ายออกแล้ว' && (
                                            <button onClick={() => handleCancel(b.bookingId)} className="text-red-400 font-bold hover:underline">ยกเลิก</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {filteredBookings.length === 0 && (
                                <p className="text-center py-16 text-muted-foreground">ไม่มีการจองที่ตรงเงื่อนไข</p>
                            )}
                        </div>
                    </div>

                    {/* คอลัมน์ขวา: สรุปยอดวันนี้ */}
                    <div className="flex flex-col gap-4">
                        <div className="bg-card p-5 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">เช็คอินวันนี้</p>
                                <p className="text-2xl font-black">{arrivalsToday}</p>
                            </div>
                            <span className="text-primary text-2xl">→</span>
                        </div>
                        <div className="bg-card p-5 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">เช็คเอาท์วันนี้</p>
                                <p className="text-2xl font-black">{departuresToday}</p>
                            </div>
                            <span className="text-orange-500 text-2xl">←</span>
                        </div>
                        <div className="bg-card p-5 rounded-xl shadow-md flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">กำลังเข้าพักทั้งหมด</p>
                                <p className="text-2xl font-black">{totalGuests}</p>
                            </div>
                            <span className="text-blue-500 text-2xl">👥</span>
                        </div>
                        <div className="bg-card p-5 rounded-xl shadow-md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">ห้องว่างวันนี้</p>
                                    <p className="text-2xl font-black">{availableRoomsCount}</p>
                                </div>
                                <span className="text-green-500 text-2xl">✓</span>
                            </div>
                            {availableRoomsCount > 0 && (
                                <ul className="mt-3 pt-3 border-t border-border space-y-1">
                                    {Object.entries(availableByType).map(([type, count]) => (
                                        <li key={type} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{type}</span>
                                            <span className="font-bold">{count} ห้อง</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
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

            {/* Modal ข้อมูลผู้เข้าพัก + สลิปที่แนบมา */}
            {verifyTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-1">ข้อมูลผู้เข้าพัก — ห้อง {verifyTarget.roomNumber}</h2>
                        <p className="text-sm text-muted-foreground mb-5">{verifyTarget.checkInDate?.split('T')[0]} — {verifyTarget.checkOutDate?.split('T')[0]}</p>

                        <div className="bg-muted/50 rounded-xl p-4 mb-4 space-y-1 text-sm">
                            <p><span className="text-muted-foreground">ชื่อลูกค้า:</span> {verifyTarget.guestName || verifyTarget.username || 'ไม่ระบุ'}</p>
                            <p><span className="text-muted-foreground">เบอร์โทร:</span> {verifyTarget.guestPhone || '-'}</p>
                            <p><span className="text-muted-foreground">อีเมล:</span> {verifyTarget.guestEmail || '-'}</p>
                            {verifyTarget.latestPaymentId && (
                                <>
                                    <p><span className="text-muted-foreground">ยอดที่แจ้งชำระ:</span> ฿{verifyTarget.latestAmount ?? '-'}</p>
                                    <p><span className="text-muted-foreground">ช่องทาง:</span> {verifyTarget.latestMethod || '-'}</p>
                                    <p><span className="text-muted-foreground">สถานะการชำระ:</span> {verifyTarget.latestPaymentStatus || '-'}</p>
                                </>
                            )}
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-bold mb-2">สลิปการโอน</p>
                            {verifyTarget.latestSlipUrl ? (
                                <img src={verifyTarget.latestSlipUrl} alt="สลิปการโอน" className="w-full rounded-xl border border-border" />
                            ) : (
                                <p className="text-sm text-muted-foreground">ไม่มีรูปสลิปแนบมา</p>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setVerifyTarget(null)} className="px-6 py-3 text-muted-foreground font-bold hover:bg-muted rounded-xl">ปิด</button>
                            {verifyTarget.hasPendingSlip && (
                                <>
                                    <button onClick={() => handleVerifySlip('reject')} disabled={saving} className="px-6 py-3 bg-red-500 text-white rounded-xl font-black disabled:opacity-50">
                                        ปฏิเสธ
                                    </button>
                                    <button onClick={() => handleVerifySlip('approve')} disabled={saving} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-black disabled:opacity-50">
                                        {saving ? 'กำลังบันทึก...' : 'ยืนยันการชำระ'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagementDaily;
