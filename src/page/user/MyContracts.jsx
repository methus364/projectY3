import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

// แมปสถานะสัญญา (ค่าจริงใน DB) → สีแสดงผล
const CONTRACT_STATUS_STYLE = {
  'มีผลใช้งาน': 'bg-green-100 text-green-700',
  'หมดอายุ':    'bg-gray-100 text-gray-500',
  'ยกเลิกสัญญา': 'bg-red-100 text-red-700',
};

const fmt = (dateStr) => (dateStr ? dateStr.split('T')[0] : '-');

// จำนวนวันที่เหลือจนถึงวันสิ้นสุดสัญญา
const daysToExpiry = (endDate) => {
  if (!endDate) return null;
  return Math.ceil((new Date(endDate) - new Date()) / 86400000);
};

export default function MyContracts() {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // modal ประวัติการต่อสัญญา
  const [historyRows, setHistoryRows] = useState(null);

  const loadContracts = () => {
    api.get('/my-contracts')
      .then((res) => {
        if (res.data.success) setContracts(res.data.data);
      })
      .catch(() => setError('ดึงข้อมูลสัญญาไม่สำเร็จ'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    loadContracts();
  }, [navigate]);

  // ขอแจ้งย้ายออก — เป็นแค่คำขอ รอ Admin ยืนยัน
  const requestNotice = async (c) => {
    if (!window.confirm('ส่งคำขอแจ้งย้ายออก? (รอแอดมินยืนยันก่อนถึงมีผลจริง)')) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/contract/${c.contract_id}/notice-request`);
      if (res.data.success) { alert(res.data.message); loadContracts(); }
    } catch (err) {
      alert(err.response?.data?.message || 'ส่งคำขอไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  // ขอต่อสัญญา
  const requestRenewal = async (c) => {
    if (!window.confirm('ส่งคำขอต่อสัญญา? (รอแอดมินดำเนินการ)')) return;
    try {
      setSubmitting(true);
      const res = await api.post(`/contract/${c.contract_id}/renew-request`);
      if (res.data.success) { alert(res.data.message); loadContracts(); }
    } catch (err) {
      alert(err.response?.data?.message || 'ส่งคำขอไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const viewHistory = async (c) => {
    try {
      const res = await api.get(`/contract/${c.contract_id}/history`);
      if (res.data.success) setHistoryRows(res.data.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ดึงประวัติไม่สำเร็จ');
    }
  };

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
              const active = c.contract_status === 'มีผลใช้งาน' && !c.settled_at;
              const days = daysToExpiry(c.end_date);
              const nearExpiry = active && days !== null && days <= 30 && days >= 0;
              // สถานะแจ้งย้ายออก: ยืนยันแล้ว > รอยืนยัน > ยังไม่แจ้ง
              const noticed = c.notice_date;
              const pendingNotice = c.notice_requested_at && !c.notice_date;

              return (
                <div key={c.contract_id} className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
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

                  {/* แบนเนอร์เตือนใกล้ครบสัญญา */}
                  {nearExpiry && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-3">
                      <p className="text-amber-700 text-sm font-bold">
                        ⏰ สัญญาจะครบกำหนดในอีก {days} วัน (วันที่ {fmt(c.end_date)})
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">กรุณาติดต่อต่อสัญญา หรือแจ้งย้ายออก</p>
                    </div>
                  )}

                  {/* สถานะคำขอ */}
                  {pendingNotice && (
                    <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 py-2 mb-3">
                      <p className="text-orange-700 text-sm font-bold">📩 รอแอดมินยืนยันการแจ้งย้ายออก</p>
                    </div>
                  )}
                  {noticed && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-2 mb-3">
                      <p className="text-red-700 text-sm font-bold">🚪 แจ้งย้ายออกแล้ว (วันที่ {fmt(c.notice_date)})</p>
                    </div>
                  )}
                  {active && c.renewal_requested_at && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-2 mb-3">
                      <p className="text-blue-700 text-sm font-bold">🔄 ส่งคำขอต่อสัญญาแล้ว รอแอดมินดำเนินการ</p>
                    </div>
                  )}

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
                  </div>

                  {/* ปุ่มดำเนินการ */}
                  <div className="flex flex-wrap gap-2">
                    {c.contract_file_url && (
                      <a href={c.contract_file_url} target="_blank" rel="noreferrer"
                        className="flex-1 text-center py-2.5 bg-[#F3EDF9] text-[#5A2D82] font-bold rounded-2xl text-sm hover:bg-[#E9DDF5] transition">
                        📄 ดูสัญญา
                      </a>
                    )}
                    <button onClick={() => viewHistory(c)}
                      className="flex-1 py-2.5 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl text-sm hover:bg-[#E2E8F0] transition">
                      ประวัติการต่อสัญญา
                    </button>
                  </div>

                  {/* ปุ่มขอต่อสัญญา / แจ้งย้ายออก (เฉพาะสัญญาที่ยัง active และยังไม่แจ้งย้าย) */}
                  {active && !noticed && (
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => requestRenewal(c)} disabled={submitting || c.renewal_requested_at}
                        className="flex-1 py-2.5 bg-blue-50 border border-blue-200 text-blue-600 font-bold rounded-2xl text-sm hover:bg-blue-100 transition disabled:opacity-50">
                        ขอต่อสัญญา
                      </button>
                      <button onClick={() => requestNotice(c)} disabled={submitting || pendingNotice}
                        className="flex-1 py-2.5 bg-orange-50 border border-orange-200 text-orange-600 font-bold rounded-2xl text-sm hover:bg-orange-100 transition disabled:opacity-50">
                        แจ้งย้ายออก
                      </button>
                    </div>
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

      {/* Modal ประวัติการต่อสัญญา */}
      {historyRows !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setHistoryRows(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[#1E293B] text-lg font-black">ประวัติการต่อสัญญา</h2>
              <button onClick={() => setHistoryRows(null)} className="text-[#94A3B8] hover:text-[#1E293B]">✕</button>
            </div>
            {historyRows.length === 0 ? (
              <p className="text-[#64748B] text-center py-6">ยังไม่มีประวัติ</p>
            ) : (
              <div className="space-y-3">
                {historyRows.map((h) => (
                  <div key={h.audit_id} className="border border-[#E2E8F0] rounded-2xl p-3 text-sm">
                    <div className="flex justify-between text-[#94A3B8]">
                      <span className="font-bold">{h.action}</span>
                      <span>{fmt(h.changed_at)}</span>
                    </div>
                    {h.action === 'UPDATE' && h.old_data && h.new_data && h.old_data.end_date !== h.new_data.end_date && (
                      <p className="text-xs text-[#64748B] mt-1">
                        วันสิ้นสุด: {fmt(h.old_data.end_date)} → {fmt(h.new_data.end_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
