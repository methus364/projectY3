import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

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
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">แจ้งซ่อมห้องพัก</h1>

        {/* กรณีไม่มีการจองที่ active */}
        {!activeBooking ? (
          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl p-5 text-center">
            <p className="font-medium">ไม่พบการเข้าพักที่กำลังดำเนินอยู่</p>
            <p className="text-sm mt-1">สามารถแจ้งซ่อมได้เฉพาะเมื่อเช็คอินแล้วเท่านั้น</p>
          </div>
        ) : (
          <>
            {/* ข้อมูลห้องที่กำลังเข้าพัก */}
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
              <p className="text-sm text-primary">
                กำลังเข้าพักห้อง <strong>{activeBooking.roomNumber || activeBooking.roomId}</strong>
                {' '}(booking #{activeBooking.bookingId})
              </p>
            </div>

            {/* ฟอร์มแจ้งซ่อม */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">แจ้งปัญหาใหม่</h2>

              {successMsg && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 text-green-700 rounded-lg text-sm">
                  {successMsg}
                </div>
              )}
              {errorMsg && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    หัวข้อปัญหา <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={problemTitle}
                    onChange={(e) => setProblemTitle(e.target.value)}
                    placeholder="เช่น แอร์ไม่เย็น, น้ำรั่ว, หลอดไฟขาด"
                    required
                    className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    value={problemDetails}
                    onChange={(e) => setProblemDetails(e.target.value)}
                    placeholder="อธิบายปัญหาเพิ่มเติม (ไม่บังคับ)"
                    rows={3}
                    className="w-full border border-border bg-background text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !problemTitle.trim()}
                  className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition disabled:opacity-50"
                >
                  {submitting ? 'กำลังส่ง...' : 'ส่งคำร้องแจ้งซ่อม'}
                </button>
              </form>
            </div>

            {/* รายการที่แจ้งซ่อมไปแล้ว */}
            {myRepairs.length > 0 && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">รายการที่แจ้งไปแล้ว</h2>
                <div className="space-y-3">
                  {myRepairs.map((r) => {
                    const cfg = REPAIR_STATUS[r.status] || { label: r.status, color: 'bg-muted text-foreground' };
                    return (
                      <div key={r.repair_id} className="border border-border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-foreground">{r.problem_title}</p>
                            {r.problem_details && (
                              <p className="text-xs text-muted-foreground mt-1">{r.problem_details}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{r.reported_date?.split('T')[0]}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${cfg.color}`}>
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

        <button onClick={() => navigate(-1)} className="mt-6 text-sm text-muted-foreground hover:text-foreground underline">
          ← ย้อนกลับ
        </button>
      </div>
    </div>
  );
}
