import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

// แมป status ของการแจ้งซ่อม → ข้อความภาษาไทย
const REPAIR_STATUS_LABEL = {
    pending:     'รอตรวจสอบ',
    in_progress: 'กำลังดำเนินการ',
    done:        'เสร็จสิ้น',
};

export default function RepairRequest() {
    const navigate = useNavigate();

    // State สำหรับการจองที่ active ของ tenant
    const [activeBooking, setActiveBooking] = useState(null);
    const [myRepairs, setMyRepairs] = useState([]);
    const [loading, setLoading] = useState(true);

    // State สำหรับฟอร์มแจ้งซ่อม
    const [problemTitle, setProblemTitle] = useState('');
    const [problemDetails, setProblemDetails] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    // ==========================================
    // โหลด: หาการจองที่ "กำลังเข้าพัก" ของ tenant
    // ==========================================
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            const headers = { Authorization: `Bearer ${token}` };

            try {
                // ดึงประวัติการจองของตัวเอง (checkbooking ใช้ token เพื่อระบุ user อัตโนมัติ)
                const bookingRes = await axios.post(`${API}/checkbooking`, {}, { headers });
                if (bookingRes.data.success) {
                    const allBookings = bookingRes.data.data;
                    // หาการจองที่กำลังเข้าพักอยู่ (มีได้แค่ 1 ห้องต่อเวลา)
                    const active = allBookings.find(b => b.bookingStatus === 'กำลังเข้าพัก');
                    setActiveBooking(active || null);

                    // ดึงรายการแจ้งซ่อมของการจองที่ active (ถ้ามี)
                    if (active) {
                        const repairRes = await axios.get(
                            `${API}/my-repairs/${active.bookingId}`,
                            { headers }
                        );
                        if (repairRes.data.success) {
                            setMyRepairs(repairRes.data.data);
                        }
                    }
                }
            } catch (err) {
                console.error('โหลดข้อมูลไม่สำเร็จ:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    // ==========================================
    // ส่งฟอร์มแจ้งซ่อม
    // ==========================================
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!problemTitle.trim()) return;

        setSubmitting(true);
        setSuccessMsg('');
        setErrorMsg('');

        const token = localStorage.getItem('token');
        try {
            const res = await axios.post(
                `${API}/repair`,
                {
                    booking_id:      activeBooking.bookingId,
                    problem_title:   problemTitle.trim(),
                    problem_details: problemDetails.trim() || null,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setSuccessMsg('แจ้งซ่อมสำเร็จแล้ว ทางหอพักจะดำเนินการโดยเร็ว');
                // เพิ่มรายการใหม่ขึ้น list
                setMyRepairs(prev => [res.data.data, ...prev]);
                setProblemTitle('');
                setProblemDetails('');
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-500">
                กำลังโหลดข้อมูล...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">แจ้งซ่อมห้องพัก</h1>

                {/* กรณีไม่มีการจองที่ active */}
                {!activeBooking ? (
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-5 text-center">
                        <p className="font-medium">ไม่พบการเข้าพักที่กำลังดำเนินอยู่</p>
                        <p className="text-sm mt-1">สามารถแจ้งซ่อมได้เฉพาะเมื่อเช็คอินแล้วเท่านั้น</p>
                    </div>
                ) : (
                    <>
                        {/* แสดงข้อมูลห้องที่กำลังเข้าพัก */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                            <p className="text-sm text-blue-700">
                                กำลังเข้าพักห้อง <strong>{activeBooking.roomNumber || activeBooking.roomId}</strong>
                                {' '}(booking #{activeBooking.bookingId})
                            </p>
                        </div>

                        {/* ฟอร์มแจ้งซ่อม */}
                        <div className="bg-white rounded-xl shadow p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">แจ้งปัญหาใหม่</h2>

                            {successMsg && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                                    {successMsg}
                                </div>
                            )}
                            {errorMsg && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {errorMsg}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        หัวข้อปัญหา <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={problemTitle}
                                        onChange={(e) => setProblemTitle(e.target.value)}
                                        placeholder="เช่น แอร์ไม่เย็น, น้ำรั่ว, หลอดไฟขาด"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        รายละเอียดเพิ่มเติม
                                    </label>
                                    <textarea
                                        value={problemDetails}
                                        onChange={(e) => setProblemDetails(e.target.value)}
                                        placeholder="อธิบายปัญหาเพิ่มเติม (ไม่บังคับ)"
                                        rows={3}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting || !problemTitle.trim()}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
                                >
                                    {submitting ? 'กำลังส่ง...' : 'ส่งคำร้องแจ้งซ่อม'}
                                </button>
                            </form>
                        </div>

                        {/* รายการที่แจ้งซ่อมไปแล้ว */}
                        {myRepairs.length > 0 && (
                            <div className="bg-white rounded-xl shadow p-6">
                                <h2 className="text-lg font-semibold text-gray-700 mb-4">รายการที่แจ้งไปแล้ว</h2>
                                <div className="space-y-3">
                                    {myRepairs.map((r) => (
                                        <div key={r.repair_id} className="border border-gray-100 rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{r.problem_title}</p>
                                                    {r.problem_details && (
                                                        <p className="text-xs text-gray-500 mt-1">{r.problem_details}</p>
                                                    )}
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {r.reported_date?.split('T')[0]}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    r.status === 'done'        ? 'bg-green-100 text-green-700' :
                                                    r.status === 'in_progress' ? 'bg-blue-100 text-blue-700'  :
                                                                                 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {REPAIR_STATUS_LABEL[r.status] || r.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <button
                    onClick={() => navigate(-1)}
                    className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
                >
                    ← ย้อนกลับ
                </button>
            </div>
        </div>
    );
}
