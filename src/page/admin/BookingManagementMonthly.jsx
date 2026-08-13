import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingNavbar from '../../components/admin/BookingNavbar';
import api from '../../lib/api';

const STATUS_COLOR = {
    'รอชำระมัดจำ': 'bg-yellow-50 text-yellow-700 border-yellow-200',
    'ยืนยันการจอง': 'bg-green-50 text-green-700 border-green-200',
    'กำลังเข้าพัก': 'bg-blue-50 text-blue-700 border-blue-200',
    'ยกเลิก': 'bg-red-50 text-red-700 border-red-200',
    'ย้ายออกแล้ว': 'bg-muted/30 text-muted-foreground border-border',
};

// ชั้นของห้อง = เลขตัวแรกของเลขห้อง (102 → ชั้น 1)
const floorOf = (roomNumber) => String(roomNumber || '').charAt(0) || '?';

const BookingManagementMonthly = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // ผังชั้น
    const [planDate, setPlanDate] = useState('');
    const [availability, setAvailability] = useState([]);

    // modal จอง walk-in (จากผังชั้น)
    const [bookRoom, setBookRoom] = useState(null); // ห้องที่เลือกจากผัง
    const [walkin, setWalkin] = useState({ full_name: '', phone_number: '' });

    // modal เช็คอิน + ฟอร์มสัญญา
    const [checkinTarget, setCheckinTarget] = useState(null);
    const [contract, setContract] = useState({ roomPrice: '', startDate: '', months: 12, rentPrepaid: '', securityDeposit: '', keyDeposit: '', file: null });
    const [saving, setSaving] = useState(false);

    // modal ข้อมูลผู้เข้าพัก + สลิปที่แนบมา
    const [verifyTarget, setVerifyTarget] = useState(null);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/bookings?rentType=monthly');
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

    useEffect(() => { fetchBookings(); }, []);

    // โหลดผังชั้น ณ วันที่เลือก
    const loadAvailability = async (date) => {
        setPlanDate(date);
        if (!date) { setAvailability([]); return; }
        try {
            const res = await api.get(`/rooms/availability?date=${date}`);
            if (res.data.success) setAvailability(res.data.data);
        } catch (err) {
            alert(err.response?.data?.message || 'โหลดผังชั้นไม่สำเร็จ');
        }
    };

    // จอง walk-in สำหรับห้องที่เลือกจากผัง (endDate ชั่วคราว +1 เดือน ให้ผ่าน overlap)
    const handleWalkinBook = async () => {
        if (!walkin.full_name || !walkin.phone_number) { alert('กรุณากรอกชื่อและเบอร์โทร'); return; }
        try {
            setSaving(true);
            const mRes = await api.post('/admin/quick-member', walkin);
            const memberId = mRes.data.memberId;
            const start = planDate;
            const end = new Date(planDate);
            end.setMonth(end.getMonth() + 1);
            await api.post('/admin/booking', {
                roomId: bookRoom.room_id, userId: memberId,
                startDate: start, endDate: end.toISOString().split('T')[0], rentType: 'monthly',
            });
            alert('สร้างการจองรายเดือนสำเร็จ');
            setBookRoom(null); setWalkin({ full_name: '', phone_number: '' });
            loadAvailability(planDate);
            fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'จองไม่สำเร็จ');
        } finally {
            setSaving(false);
        }
    };

    // เปิดฟอร์มเช็คอิน + สัญญา (ค่าห้อง default = price_monthly, มัดจำเริ่มว่าง)
    const openCheckin = (b) => {
        setCheckinTarget(b);
        setContract({
            roomPrice: b.priceMonthly || '',
            startDate: b.checkInDate?.split('T')[0] || '',
            months: 12, rentPrepaid: b.priceMonthly || '',
            securityDeposit: '', keyDeposit: '', file: null,
        });
    };

    const handleCheckIn = async () => {
        try {
            setSaving(true);
            const form = new FormData();
            if (contract.startDate) form.append('startDate', contract.startDate);
            form.append('contractMonths', contract.months);
            if (contract.rentPrepaid !== '') form.append('rentPrepaid', contract.rentPrepaid);
            if (contract.securityDeposit !== '') form.append('securityDeposit', contract.securityDeposit);
            if (contract.keyDeposit !== '') form.append('keyDeposit', contract.keyDeposit);
            if (contract.file) form.append('contract_file', contract.file);
            await api.put(`/admin/booking/${checkinTarget.bookingId}/checkin`, form);
            alert('เช็คอิน + สร้างสัญญาสำเร็จ');
            const guestName = checkinTarget.guestName || checkinTarget.username || '';
            setCheckinTarget(null);
            // เช็คอินเสร็จแล้วพาไปหน้าจัดการลูกค้ารายเดือน พร้อมค้นหาชื่อลูกค้าคนนี้ให้เลย
            navigate(`/admin/customers-monthly?search=${encodeURIComponent(guestName)}`);
        } catch (err) {
            alert(err.response?.data?.message || 'เช็คอินไม่สำเร็จ');
        } finally {
            setSaving(false);
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

    // จัดกลุ่มห้องตามชั้นสำหรับผัง
    const floors = {};
    for (const room of availability) {
        const f = floorOf(room.room_number);
        if (!floors[f]) floors[f] = [];
        floors[f].push(room);
    }

    if (loading) return <div className="p-10 text-center font-bold text-muted-foreground">กำลังโหลด...</div>;

    return (
        <div className="bg-background min-h-screen pb-10">
            <BookingNavbar />
            <div className="container mx-auto bg-card p-6 shadow-md rounded-xl mt-6">
                <h1 className="text-2xl font-black text-foreground mb-6">จัดการการจอง — รายเดือน</h1>

                {/* ผังชั้น */}
                <div className="bg-muted/40 rounded-2xl p-5 mb-6 border border-border">
                    <div className="flex items-center gap-3 mb-4">
                        <label className="text-sm font-bold">เลือกวันเข้าพักเพื่อดูผังห้องว่าง:</label>
                        <input type="date" value={planDate} onChange={(e) => loadAvailability(e.target.value)}
                            className="border border-border rounded-lg px-3 py-1.5 text-sm bg-background" />
                    </div>
                    {planDate && Object.keys(floors).sort().map((f) => (
                        <div key={f} className="mb-4">
                            <p className="text-xs font-black text-muted-foreground mb-2">ชั้น {f}</p>
                            <div className="flex flex-wrap gap-2">
                                {floors[f].map((room) => (
                                    <button key={room.room_id}
                                        disabled={!room.available}
                                        onClick={() => setBookRoom(room)}
                                        className={`px-4 py-3 rounded-xl font-bold text-sm border-2 transition ${
                                            room.available
                                                ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
                                                : 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed'
                                        }`}>
                                        ห้อง {room.room_number}
                                        <span className="block text-[10px] font-normal">
                                            {room.available ? `฿${Number(room.price_monthly || 0).toLocaleString()}/ด.` : 'ไม่ว่าง'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    {!planDate && <p className="text-sm text-muted-foreground">เลือกวันที่เพื่อแสดงผังห้อง (เขียว = ว่าง กดจองได้ · แดง = ไม่ว่าง)</p>}
                </div>

                {/* ตารางการจองรายเดือน */}
                <div className="overflow-x-auto border rounded-2xl">
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted text-foreground text-xs uppercase">
                            <tr>
                                <th className="px-4 py-4 text-left font-bold">ห้อง</th>
                                <th className="px-4 py-4 text-left font-bold">ลูกค้า</th>
                                <th className="px-4 py-4 text-left font-bold">เข้าพัก</th>
                                <th className="px-4 py-4 text-left font-bold">สถานะ</th>
                                <th className="px-4 py-4 text-center font-bold">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                            {bookings.map((b) => (
                                <tr key={b.bookingId} className="hover:bg-muted/30">
                                    <td className="px-4 py-4 font-black text-primary">ห้อง {b.roomNumber}</td>
                                    <td className="px-4 py-4">{b.guestName || b.username || 'ไม่ระบุ'}</td>
                                    <td className="px-4 py-4 text-sm text-muted-foreground">{b.checkInDate?.split('T')[0]}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black border ${STATUS_COLOR[b.bookingStatus] || ''}`}>
                                            {b.bookingStatus}
                                        </span>
                                        {b.hasPendingSlip && (
                                            <span className="block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 w-fit">⏳ ยังไม่ตรวจสอบสลิป</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                                            <button onClick={() => openVerifyModal(b)} className="px-2 py-1 bg-blue-500 text-white rounded-lg font-bold">ดูข้อมูลผู้เข้าพัก</button>
                                            {/* เช็คอิน = เปิดฟอร์มสัญญา · ไม่มีปุ่มเช็คเอาท์เร็ว (ต้องไปเคลียร์สัญญาที่หน้าสัญญา) */}
                                            {(b.bookingStatus === 'รอชำระมัดจำ' || b.bookingStatus === 'ยืนยันการจอง') && (
                                                <button onClick={() => openCheckin(b)} className="px-2 py-1 bg-primary text-primary-foreground rounded-lg font-bold">เข้าพัก (ทำสัญญา)</button>
                                            )}
                                            {b.bookingStatus === 'กำลังเข้าพัก' && (
                                                <span className="text-muted-foreground text-[11px]">เช็คเอาท์ที่หน้า "สัญญาเช่า"</span>
                                            )}
                                            {b.bookingStatus !== 'ยกเลิก' && b.bookingStatus !== 'ย้ายออกแล้ว' && b.bookingStatus !== 'กำลังเข้าพัก' && (
                                                <button onClick={() => handleCancel(b.bookingId)} className="text-red-400 font-bold hover:underline">ยกเลิก</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr><td colSpan="5" className="text-center py-16 text-muted-foreground">ไม่มีการจองรายเดือน</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal จอง walk-in จากผังชั้น */}
            {bookRoom && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-black mb-1">จองห้อง {bookRoom.room_number} (รายเดือน)</h2>
                        <p className="text-sm text-muted-foreground mb-5">วันเข้าพัก {planDate}</p>
                        <div className="space-y-4">
                            <input type="text" placeholder="ชื่อ-นามสกุลลูกค้า" value={walkin.full_name}
                                onChange={(e) => setWalkin({ ...walkin, full_name: e.target.value })}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            <input type="tel" placeholder="เบอร์โทร" value={walkin.phone_number}
                                onChange={(e) => setWalkin({ ...walkin, phone_number: e.target.value })}
                                className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setBookRoom(null)} className="px-6 py-3 text-muted-foreground font-bold hover:bg-muted rounded-xl">ยกเลิก</button>
                            <button onClick={handleWalkinBook} disabled={saving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'สร้างการจอง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal เช็คอิน + ฟอร์มสัญญา */}
            {checkinTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <div className="bg-card rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-black mb-1">กรอกรายละเอียดสัญญา — ห้อง {checkinTarget.roomNumber}</h2>
                        <p className="text-sm text-muted-foreground mb-5">{checkinTarget.guestName || checkinTarget.username}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">ค่าห้อง/เดือน</label>
                                <input type="number" value={contract.roomPrice}
                                    onChange={(e) => setContract({ ...contract, roomPrice: e.target.value, rentPrepaid: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">วันเข้าพัก</label>
                                <input type="date" value={contract.startDate}
                                    onChange={(e) => setContract({ ...contract, startDate: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">ระยะสัญญา (เดือน)</label>
                                <input type="number" min="1" value={contract.months}
                                    onChange={(e) => setContract({ ...contract, months: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">ค่าเช่าล่วงหน้า</label>
                                <input type="number" value={contract.rentPrepaid}
                                    onChange={(e) => setContract({ ...contract, rentPrepaid: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">เงินประกัน</label>
                                <input type="number" placeholder="กรอกเอง" value={contract.securityDeposit}
                                    onChange={(e) => setContract({ ...contract, securityDeposit: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">ค่ามัดจำกุญแจ</label>
                                <input type="number" placeholder="กรอกเอง" value={contract.keyDeposit}
                                    onChange={(e) => setContract({ ...contract, keyDeposit: e.target.value })}
                                    className="w-full border border-border rounded-xl p-3 bg-muted/50" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-bold mb-1">ไฟล์รูปสัญญา (เซ็นแล้ว)</label>
                                <input type="file" accept="image/*" onChange={(e) => setContract({ ...contract, file: e.target.files[0] || null })}
                                    className="w-full text-sm border border-border rounded-xl p-2.5 bg-muted/50" />
                            </div>
                        </div>
                        <p className="text-xs text-amber-600 mt-3">* มัดจำล็อกห้อง 2,000 บาทที่จ่ายตอนจอง หักจากเงินประกันแล้ว (กรอกเงินประกันเต็มจำนวนตามจริง)</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setCheckinTarget(null)} className="px-6 py-3 text-muted-foreground font-bold hover:bg-muted rounded-xl">ยกเลิก</button>
                            <button onClick={handleCheckIn} disabled={saving} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-black disabled:opacity-50">
                                {saving ? 'กำลังบันทึก...' : 'ยืนยันสร้างสัญญา'}
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
                        <p className="text-sm text-muted-foreground mb-5">เข้าพัก {verifyTarget.checkInDate?.split('T')[0]}</p>

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

export default BookingManagementMonthly;
