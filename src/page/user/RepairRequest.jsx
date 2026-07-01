import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

// แมป status → ข้อความภาษาไทย + สี
const REPAIR_STATUS = {
  pending:     { label: 'รอตรวจสอบ',      color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'bg-blue-100 text-blue-700'   },
  done:        { label: 'เสร็จสิ้น',       color: 'bg-green-100 text-green-700'  },
};

export default function RepairRequest() {
  const navigate = useNavigate();

  const [activeBooking, setActiveBooking] = useState(null);
  const [myRepairs, setMyRepairs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [problemTitle, setProblemTitle] = useState('');
  const [problemDetails, setProblemDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // โหลดการจองที่ "กำลังเข้าพัก" + รายการแจ้งซ่อม
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }

      try {
        // ส่ง body เปล่า — backend ระบุ user จาก token อัตโนมัติ
        const bookingRes = await api.post('/checkbooking', {});
        if (bookingRes.data.success) {
          const active = bookingRes.data.data.find(b => b.bookingStatus === 'กำลังเข้าพัก');
          setActiveBooking(active || null);

          if (active) {
            const repairRes = await api.get(`/my-repairs/${active.bookingId}`);
            if (repairRes.data.success) setMyRepairs(repairRes.data.data);
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

  // ส่งฟอร์มแจ้งซ่อม
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!problemTitle.trim()) return;

    setSubmitting(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await api.post('/repair', {
        booking_id:      activeBooking.bookingId,
        problem_title:   problemTitle.trim(),
        problem_details: problemDetails.trim() || null,
      });
      if (res.data.success) {
        setSuccessMsg('แจ้งซ่อมสำเร็จแล้ว ทางหอพักจะดำเนินการโดยเร็ว');
        setMyRepairs(prev => [res.data.data, ...prev]);
        setProblemTitle('');
        setProblemDetails('');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <p className="text-[#64748B] font-bold">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <PageHeader title="แจ้งซ่อมห้องพัก" subtitle="แจ้งปัญหาที่พบในห้องพักได้ที่นี่" maxWidth="max-w-xl" />

      <div className="pt-6 pb-10 px-4 max-w-xl mx-auto">

        {/* กรณีไม่มีการจองที่ active */}
        {!activeBooking ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-6 text-center">
            <p className="text-4xl mb-3">🔧</p>
            <p className="text-yellow-800 font-black">ไม่พบการเข้าพักที่กำลังดำเนินอยู่</p>
            <p className="text-yellow-700 text-sm mt-1">สามารถแจ้งซ่อมได้เฉพาะเมื่อเช็คอินแล้วเท่านั้น</p>
          </div>
        ) : (
          <>
            {/* ข้อมูลห้องที่กำลังเข้าพัก */}
            <div className="bg-[#F3EDF9] border border-[#D9C5EC] rounded-3xl px-5 py-4 mb-5 flex items-center gap-3">
              <span className="bg-[#5A2D82] p-2.5 rounded-xl text-white">🏠</span>
              <div>
                <p className="text-[#46236A] font-black text-sm">กำลังเข้าพักห้อง {activeBooking.roomNumber || activeBooking.roomId}</p>
                <p className="text-[#6A3A96] text-xs font-semibold">Booking #{activeBooking.bookingId}</p>
              </div>
            </div>

            {/* ฟอร์มแจ้งซ่อม */}
            <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-6 mb-5">
              <p className="text-[#1E293B] font-black text-base mb-4">แจ้งปัญหาใหม่</p>

              {successMsg && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-4 py-3 text-sm font-semibold">
                  ✅ {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl px-4 py-3 text-sm font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[#334155] text-sm font-bold mb-2">
                    หัวข้อปัญหา <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="เช่น แอร์ไม่เย็น, น้ำรั่ว, หลอดไฟขาด"
                    required
                    className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
                  />
                </div>
                <div>
                  <label className="block text-[#334155] text-sm font-bold mb-2">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={problemDetails}
                    onChange={(e) => setProblemDetails(e.target.value)}
                    placeholder="อธิบายปัญหาเพิ่มเติม (ไม่บังคับ)"
                    rows={3}
                    className="w-full border border-[#CBD5E1] rounded-2xl px-4 py-3 text-sm text-[#0F172A] bg-[#F8FAFC] focus:outline-none focus:border-[#5A2D82] focus:ring-2 focus:ring-[#5A2D82]/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !problemTitle.trim()}
                  className="w-full py-3.5 bg-[#D32F2F] hover:bg-[#B71C1C] text-white font-black rounded-2xl transition disabled:opacity-50"
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งคำร้องแจ้งซ่อม'}
                </button>
              </form>
            </div>

            {/* รายการที่แจ้งซ่อมไปแล้ว */}
            {myRepairs.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
                <p className="text-[#1E293B] font-black text-base mb-4">รายการที่แจ้งไปแล้ว</p>
                <div className="space-y-3">
                  {myRepairs.map((r) => {
                    const cfg = REPAIR_STATUS[r.status] || { label: r.status, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={r.repair_id} className="border border-[#E2E8F0] rounded-2xl p-4">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <p className="text-[#1E293B] text-sm font-bold">{r.problem_title}</p>
                            {r.problem_details && (
                              <p className="text-[#64748B] text-xs mt-1">{r.problem_details}</p>
                            )}
                            <p className="text-[#94A3B8] text-xs mt-1">{r.reported_date?.split('T')[0]}</p>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold whitespace-nowrap ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-center mt-5">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl hover:bg-[#F8FAFC] transition"
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>
    </div>
  );
}
