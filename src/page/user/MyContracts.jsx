import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

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
    <div className="min-h-screen bg-[#F8F9FA]">
      <Navbar />
      <PageHeader title="สัญญาเช่าของฉัน" subtitle="รายละเอียดสัญญาเช่าทั้งหมดของคุณ" />

      <div className="pt-6 pb-10 px-4 max-w-2xl mx-auto">

        {loading && (
          <div className="text-center py-10">
            <p className="text-[#64748B] font-bold">กำลังโหลด...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-center">
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && contracts.length === 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-10 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-[#64748B] font-semibold">ยังไม่มีสัญญาเช่า</p>
          </div>
        )}

        {!loading && contracts.length > 0 && (
          <div className="space-y-4">
            {contracts.map((c) => {
              const statusClass = CONTRACT_STATUS_STYLE[c.contract_status] || 'bg-gray-100 text-gray-500';
              const canNotice = c.contract_status === 'กำลังเช่า';

              return (
                <div
                  key={c.contract_id}
                  className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5"
                >
                  {/* หัวการ์ด */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-[#F3EDF9] p-2.5 rounded-xl">
                      <span className="text-lg">📄</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[#5A2D82] font-black text-base">ห้อง {c.room_number}</p>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${statusClass}`}>
                        {c.contract_status}
                      </span>
                    </div>
                  </div>

                  {/* รายละเอียดสัญญา */}
                  <div className="bg-[#F8FAFC] rounded-2xl p-4 mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8] font-semibold">วันเริ่มสัญญา</span>
                      <span className="text-[#1E293B] font-bold">{fmt(c.start_date)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8] font-semibold">วันสิ้นสุด</span>
                      <span className="text-[#1E293B] font-bold">{fmt(c.end_date)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#94A3B8] font-semibold">ค่าประกัน</span>
                      <span className="text-[#1E293B] font-bold">฿{Number(c.security_deposit || 0).toLocaleString()}</span>
                    </div>
                    {c.notice_date && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#94A3B8] font-semibold">แจ้งย้ายออก</span>
                        <span className="text-orange-600 font-bold">{fmt(c.notice_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* ปุ่มแจ้งย้ายออก */}
                  {canNotice && (
                    <button
                      onClick={() => setNoticeTarget(c)}
                      className="w-full py-2.5 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-2xl text-sm hover:bg-orange-100 transition"
                    >
                      แจ้งย้ายออก
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 bg-white border border-[#E2E8F0] text-[#64748B] font-bold rounded-2xl shadow-sm hover:bg-[#F8FAFC] transition"
          >
            ← ย้อนกลับ
          </button>
        </div>
      </div>

      {/* Modal ยืนยันแจ้งย้ายออก */}
      {noticeTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm">
            <h2 className="text-[#1E293B] text-lg font-black mb-2">ยืนยันแจ้งย้ายออก</h2>
            <p className="text-[#64748B] text-sm mb-3">
              ห้อง {noticeTarget.room_number}
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-3 mb-5">
              <p className="text-orange-700 text-sm font-bold">
                ⚠️ ระบบจะบันทึกวันแจ้งย้ายออกเป็นวันนี้ และนับ 30 วันตามเงื่อนไขสัญญา
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setNoticeTarget(null)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleNotice}
                disabled={submitting}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition disabled:opacity-50"
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
