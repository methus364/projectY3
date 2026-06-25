import React, { useState, useEffect } from 'react';
import RoomNavbar from '../../components/admin/RoomNavbar';
import api from '../../lib/api';

const Rooms = () => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedFloor, setSelectedFloor] = useState('ทั้งหมด');
    const [selectedStatus, setSelectedStatus] = useState('ทั้งหมด');
    const [showModal, setShowModal] = useState(false);

    const initialForm = {
        id: null,
        number: '',
        type_name: '',
        room_price: '',
        price_monthly: '',
        deposit_amount: '',
        image_url: '',
        room_status: 'ว่าง',
        description: '',
        amenities: '',   // กรอกคั่นด้วยจุลภาค เช่น "แอร์,ตู้เย็น,Wi-Fi"
        room_size: '',
    };
    const [form, setForm] = useState(initialForm);

    // --- Fetch Rooms ---
    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await api.get('/getRoom');
            const rawData = Array.isArray(response.data) ? response.data : response.data.data || [];
            setRooms(rawData);
        } catch (error) {
            console.error("Fetch Rooms Error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRooms(); }, []);

    // --- Open Modal ---
    const openModal = (room = null) => {
        if (room) {
            setForm({
                id: room.id,
                number: room.number,
                type_name: room.typeName || '',
                room_price: room.price || '',
                price_monthly: room.priceMonthly || '',
                deposit_amount: room.depositAmount || '',
                image_url: room.imageUrl || '',
                room_status: room.status,
                description: room.description || '',
                // amenities เก็บเป็น array ใน DB → แสดงเป็น string คั่นจุลภาคในฟอร์ม
                amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : '',
                room_size: room.roomSize || '',
            });
        } else {
            setForm(initialForm);
        }
        setShowModal(true);
    };

    // --- Save (Add / Edit) ---
    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // แปลง amenities string → array ก่อนส่ง backend
            const amenitiesArray = form.amenities
                ? form.amenities.split(',').map(s => s.trim()).filter(Boolean)
                : null;

            const payload = {
                number: form.number,
                room_status: form.room_status,
                type_name: form.type_name || null,
                room_price: form.room_price !== '' ? Number(form.room_price) : null,
                price_monthly: form.price_monthly !== '' ? Number(form.price_monthly) : null,
                deposit_amount: form.deposit_amount !== '' ? Number(form.deposit_amount) : null,
                image_url: form.image_url || null,
                description: form.description || null,
                amenities: amenitiesArray,
                room_size: form.room_size !== '' ? Number(form.room_size) : null,
            };

            if (form.id) {
                await api.put(`/editRoom/${form.id}`, payload);
                alert("อัปเดตข้อมูลห้องพักเรียบร้อย");
            } else {
                await api.post('/addRoom', payload);
                alert("เพิ่มห้องพักใหม่เรียบร้อย");
            }
            fetchRooms();
            setShowModal(false);
        } catch (error) {
            alert("เกิดข้อผิดพลาด: " + (error.response?.data?.message || error.message));
            console.error("Save Error:", error);
        }
    };

    // --- Delete ---
    const handleDelete = async (id) => {
        if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบห้องพักนี้?")) {
            try {
                await api.delete(`/deleteRoom/${id}`);
                setRooms(rooms.filter(r => r.id !== id));
                setSelectedRoom(null);
                alert("ลบห้องพักเรียบร้อย");
            } catch (error) {
                alert("ไม่สามารถลบได้: " + (error.response?.data?.message || error.message));
                console.error("Delete Error:", error);
            }
        }
    };

    // --- Filter ---
    const filteredRooms = rooms.filter(room => {
        const floorMatch = selectedFloor === 'ทั้งหมด' || String(room.number).startsWith(String(selectedFloor));
        const statusMatch = selectedStatus === 'ทั้งหมด' || room.status === selectedStatus;
        return floorMatch && statusMatch;
    });

    const statusColor = (status) => {
        if (status === 'ว่าง') return 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-100';
        if (status === 'ปิดปรับปรุง') return 'bg-gradient-to-br from-gray-400 to-gray-500 shadow-gray-100';
        return 'bg-gradient-to-br from-rose-400 to-pink-500 shadow-rose-100';
    };

    const statusHeaderColor = (status) => {
        if (status === 'ว่าง') return 'bg-emerald-500';
        if (status === 'ปิดปรับปรุง') return 'bg-gray-500';
        return 'bg-rose-500';
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-primary animate-pulse">กำลังโหลดข้อมูล...</div>;

    return (
        <div className="p-4 bg-background min-h-screen font-sans">
            <RoomNavbar />

            {/* Filter & Action Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-card p-6 rounded-2xl shadow-sm border border-border">
                <div className="flex flex-wrap gap-4">
                    <div>
                        <label className="block mb-1 text-xs font-bold text-muted-foreground uppercase">ชั้น</label>
                        <div className="flex gap-1 bg-muted p-1 rounded-xl">
                            {['ทั้งหมด', 1, 2, 3, 4].map(f => (
                                <button key={f} onClick={() => setSelectedFloor(f)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedFloor === f ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block mb-1 text-xs font-bold text-muted-foreground uppercase">สถานะ</label>
                        <select className="px-4 py-1.5 rounded-xl bg-muted text-sm font-bold outline-none border-none"
                            value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                            <option value="ทั้งหมด">ทั้งหมด</option>
                            <option value="ว่าง">ว่าง</option>
                            <option value="มีผู้เช่า">มีผู้เช่า</option>
                            <option value="ปิดปรับปรุง">ปิดปรับปรุง</option>
                        </select>
                    </div>
                </div>
                <button onClick={() => openModal()}
                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-bold shadow-lg transition-all active:scale-95">
                    + เพิ่มห้องใหม่
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {filteredRooms.map((room) => (
                    <button key={room.id} onClick={() => setSelectedRoom(room)}
                        className={`relative rounded-3xl p-6 text-white transition-all transform hover:-translate-y-2 shadow-xl ${statusColor(room.status)}`}>
                        <div className="text-3xl font-black mb-1">{room.number}</div>
                        <div className="text-[10px] bg-white/20 backdrop-blur-md px-3 py-1 rounded-full inline-block font-bold">
                            {room.status}
                        </div>
                    </button>
                ))}
            </div>

            {/* Detail Popup */}
            {selectedRoom && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
                        <div className={`p-8 text-white ${statusHeaderColor(selectedRoom.status)}`}>
                            <h2 className="text-4xl font-black">ห้อง {selectedRoom.number}</h2>
                            <p className="opacity-80 font-medium">{selectedRoom.typeName || 'ไม่ระบุประเภท'} • {selectedRoom.status}</p>
                        </div>
                        <div className="p-8">
                            <div className="space-y-4 mb-8 text-muted-foreground">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-bold">ประเภทห้อง:</span>
                                    <span className="text-primary font-black">{selectedRoom.typeName || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-bold">ราคา/วัน:</span>
                                    <span className="text-primary font-black">
                                        {selectedRoom.price ? `฿${Number(selectedRoom.price).toLocaleString()}` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-bold">ราคา/เดือน:</span>
                                    <span className="text-primary font-black">
                                        {selectedRoom.priceMonthly ? `฿${Number(selectedRoom.priceMonthly).toLocaleString()}` : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="font-bold">ค่ามัดจำ:</span>
                                    <span className="text-primary font-black">
                                        {selectedRoom.depositAmount ? `฿${Number(selectedRoom.depositAmount).toLocaleString()}` : '-'}
                                    </span>
                                </div>
                                {selectedRoom.roomSize && (
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="font-bold">ขนาดห้อง:</span>
                                        <span className="text-primary font-black">{selectedRoom.roomSize} ตร.ม.</span>
                                    </div>
                                )}
                                {selectedRoom.description && (
                                    <div className="border-b pb-2">
                                        <span className="font-bold block mb-1">คำอธิบาย:</span>
                                        <span className="text-muted-foreground text-sm">{selectedRoom.description}</span>
                                    </div>
                                )}
                                {selectedRoom.amenities?.length > 0 && (
                                    <div>
                                        <span className="font-bold block mb-2">สิ่งอำนวยความสะดวก:</span>
                                        <div className="flex flex-wrap gap-1">
                                            {selectedRoom.amenities.map((a, i) => (
                                                <span key={i} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">{a}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <button onClick={() => { openModal(selectedRoom); setSelectedRoom(null); }}
                                    className="bg-amber-400 text-white py-3 rounded-2xl font-bold hover:bg-amber-500 transition-colors">แก้ไข</button>
                                <button onClick={() => handleDelete(selectedRoom.id)}
                                    className="bg-rose-100 text-rose-600 py-3 rounded-2xl font-bold hover:bg-rose-200 transition-colors">ลบ</button>
                                <button onClick={() => setSelectedRoom(null)}
                                    className="bg-muted text-muted-foreground py-3 rounded-2xl font-bold hover:bg-muted/80">ปิด</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-[60] p-4">
                    <form onSubmit={handleSave} className="bg-card rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl">
                        <h2 className="text-3xl font-black text-foreground mb-8">
                            {form.id ? 'แก้ไขข้อมูลห้อง' : 'สร้างห้องพักใหม่'}
                        </h2>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            {/* หมายเลขห้อง */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">หมายเลขห้อง *</label>
                                <input required type="text" value={form.number}
                                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* ประเภทห้อง */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">ประเภทห้อง</label>
                                <input type="text" value={form.type_name}
                                    onChange={(e) => setForm({ ...form, type_name: e.target.value })}
                                    placeholder="เช่น Standard, Deluxe"
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* ราคา/วัน */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">ราคา/วัน (฿)</label>
                                <input type="number" min="0" value={form.room_price}
                                    onChange={(e) => setForm({ ...form, room_price: e.target.value })}
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* ราคา/เดือน */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">ราคา/เดือน (฿)</label>
                                <input type="number" min="0" value={form.price_monthly}
                                    onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* ค่ามัดจำ */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">ค่ามัดจำ (฿)</label>
                                <input type="number" min="0" value={form.deposit_amount}
                                    onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* URL รูปห้อง */}
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">URL รูปห้อง</label>
                                <input type="url" value={form.image_url}
                                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* ขนาดห้อง */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">ขนาดห้อง (ตร.ม.)</label>
                                <input type="number" min="0" value={form.room_size}
                                    onChange={(e) => setForm({ ...form, room_size: e.target.value })}
                                    placeholder="เช่น 25"
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                            </div>

                            {/* สิ่งอำนวยความสะดวก */}
                            <div>
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">สิ่งอำนวยความสะดวก</label>
                                <input type="text" value={form.amenities}
                                    onChange={(e) => setForm({ ...form, amenities: e.target.value })}
                                    placeholder="แอร์, Wi-Fi, ตู้เย็น"
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary" />
                                <p className="text-xs text-muted-foreground mt-1">คั่นด้วยจุลภาค (,)</p>
                            </div>

                            {/* คำอธิบายห้อง */}
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">คำอธิบายห้อง</label>
                                <textarea value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับห้องพัก..."
                                    rows={3}
                                    className="w-full bg-muted/50 rounded-2xl p-4 font-bold outline-none focus:ring-2 focus:ring-primary resize-none" />
                            </div>

                            {/* สถานะห้อง */}
                            <div className="col-span-2">
                                <label className="block text-xs font-black text-muted-foreground mb-2 uppercase tracking-widest">สถานะห้อง</label>
                                <div className="flex gap-2 p-1 bg-muted rounded-2xl">
                                    {[
                                        { value: 'ว่าง', active: 'bg-emerald-500 text-white shadow-md' },
                                        { value: 'มีผู้เช่า', active: 'bg-rose-500 text-white shadow-md' },
                                        { value: 'ปิดปรับปรุง', active: 'bg-gray-500 text-white shadow-md' },
                                    ].map(({ value, active }) => (
                                        <button key={value} type="button"
                                            onClick={() => setForm({ ...form, room_status: value })}
                                            className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${form.room_status === value ? active : 'text-muted-foreground hover:text-foreground'}`}>
                                            {value}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button type="submit"
                                className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-black text-lg hover:bg-primary/90 shadow-xl transition-all active:scale-95">
                                บันทึกข้อมูล
                            </button>
                            <button type="button" onClick={() => setShowModal(false)}
                                className="px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-bold hover:bg-muted/80">
                                ยกเลิก
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Rooms;
