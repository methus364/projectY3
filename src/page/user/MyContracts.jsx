import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';

// แมปสถานะสัญญา → สีแสดงผล
const CONTRACT_STATUS_STYLE = {
  'กำลังเช่า':  'bg-green-100 text-green-700',
  'แจ้งย้ายออก': 'bg-yellow-100 text-yellow-700',
  'สิ้นสุดแล้ว': 'bg-gray-100 text-gray-500',
};

export default function MyContracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // modal ยืนยันแจ้งย้ายออก
  const [noticeTarget, setNoticeTarget] = useState(null); // contract ที่กำลังจะแจ้งย้าย
  const [submitting, setSubmitting] = useState(false);

  // โหลดสัญญาทั้งหมดของผู้เช่าที่ login อยู่
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    api.get('/my-contracts')
      .then((res) => {
        if (res.data.success) setContracts(res.data.data);
      })
      .catch(() => setError('ดึงข้อมูลสัญญาไม่สำเร็จ'))
      .finally(() => setLoading(false));
  }, [navigate]);

  // แจ้งย้ายออก — ส่ง PUT /contract/:id/notice
  const handleNotice = async () => {
    if (!noticeTarget) return;
    try {
      setSubmitting(true);
      const res = await api.put(`/contract/${noticeTarget.contract_id}/notice`);
      if (res.data.success) {
        // อัปเดต state โดยไม่ต้อง reload ทั้งหน้า
        setContracts((prev) =>
          prev.map((c) =>
            c.contract_id === noticeTarget.contract_id
              ? { ...c, contract_status: 'แจ้งย้ายออก', notice_date: new Date().toISOString() }
              : c
          )
        );
        setNoticeTarget(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาด ไม่สามารถแจ้งย้ายออกได้');
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (dateStr) => (dateStr ? dateStr.split('T')[0] : '-');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-20 pb-10 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground mb-6">สัญญาเช่าของฉัน</h1>

        {loading && (
          <p className="text-muted-foreground text-center py-10">กำลังโหลด...</p>
        )}

        {error && (
          <p className="text-destructive text-center py-10">{error}</p>
        )}

        {!loading && !error && contracts.length === 0 && (
          <p className="text-muted-foreground text-center py-10">ยังไม่มีสัญญาเช่า</p>
        )}

        {!loading && contracts.length > 0 && (
          <div className="space-y-4">
            {contracts.map((c) => {
              const statusClass = CONTRACT_STATUS_STYLE[c.contract_status] || 'bg-gray-100 text-gray-500';
              const canNotice = c.contract_status === 'กำลังเช่า';

              return (
                <div
                  key={c.contract_id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm"
                >
                  {/* หัวการ์ด — เลขห้อง + สถานะ */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <p className="text-lg font-bold text-primary">ห้อง {c.room_number}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusClass}`}>
                      {c.contract_status}
                    </span>
                  </div>

                  {/* รายละเอียดสัญญา */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-sm text-foreground mb-3">
                    <div>
                      <span className="text-muted-foreground">วันเริ่มสัญญา: </span>
                      {fmt(c.start_date)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">วันสิ้นสุด: </span>
                      {fmt(c.end_date)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">ค่าประกัน: </span>
                      ฿{Number(c.deposit_amount || 0).toLocaleString()}
                    </div>
                    {c.notice_date && (
                      <div>
                        <span className="text-muted-foreground">แจ้งย้ายออก: </span>
                        {fmt(c.notice_date)}
                      </div>
                    )}
                  </div>

                  {/* ปุ่มแจ้งย้ายออก — แสดงเฉพาะสัญญาที่ยังกำลังเช่า */}
                  {canNotice && (
                    <button
                      onClick={() => setNoticeTarget(c)}
                      className="mt-1 px-4 py-1.5 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/80 transition"
                    >
                      แจ้งย้ายออก
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal ยืนยันแจ้งย้ายออก */}
      {noticeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold text-foreground mb-2">ยืนยันแจ้งย้ายออก</h2>
            <p className="text-sm text-muted-foreground mb-4">
              ห้อง {noticeTarget.room_number} — ระบบจะบันทึกวันแจ้งย้ายออกเป็นวันนี้
              และนับ 30 วันตามเงื่อนไขสัญญา
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setNoticeTarget(null)}
                className="px-4 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleNotice}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-destructive text-white rounded-lg hover:bg-destructive/80 transition disabled:opacity-50"
              >
                {submitting ? 'กำลังบันทึก...' : 'ยืนยันแจ้งย้ายออก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
