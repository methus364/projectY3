import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// สีป้ายสถานะการชำระ
const statusBadge = (status) => {
  if (status === 'ยืนยันแล้ว') return 'bg-green-100 text-green-800';
  if (status === 'ปฏิเสธ') return 'bg-red-100 text-red-800';
  return 'bg-yellow-100 text-yellow-800'; // รอตรวจ
};

const money = (val) => (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

function Money() {
  const [statusFilter, setStatusFilter] = useState('');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [slipUrl, setSlipUrl] = useState(null); // modal ดูสลิป

  // ==========================================
  // โหลดรายการชำระเงินตามสถานะที่เลือก
  // ==========================================
  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`${API}/payments?${params.toString()}`, getAuthHeader());
      if (res.data.success) {
        setPayments(res.data.data);
      }
    } catch (err) {
      console.error('โหลดรายการชำระเงินไม่สำเร็จ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  // ==========================================
  // ยืนยัน/ปฏิเสธการชำระ
  // ==========================================
  const handleVerify = async (paymentId, action) => {
    const label = action === 'approve' ? 'ยืนยัน' : 'ปฏิเสธ';
    if (!window.confirm(`ต้องการ${label}การชำระเงินรายการนี้?`)) return;
    try {
      const res = await axios.put(
        `${API}/payment/${paymentId}/verify`,
        { action },
        getAuthHeader()
      );
      if (res.data.success) {
        alert(res.data.message);
        fetchPayments();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'ดำเนินการไม่สำเร็จ');
    }
  };

  // สรุปยอด: ยืนยันแล้วรวม + จำนวนรายการรอตรวจ
  const summary = useMemo(() => {
    let confirmedTotal = 0;
    let pendingCount = 0;
    for (const p of payments) {
      if (p.payment_status === 'ยืนยันแล้ว') confirmedTotal += Number(p.amount_paid) || 0;
      if (p.payment_status === 'รอตรวจ') pendingCount += 1;
    }
    return { confirmedTotal, pendingCount };
  }, [payments]);

  return (
    <>
      <div className="flex w-full flex-col bg-white p-6">

        {/* ส่วนหัว + filter */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">ตรวจสอบการชำระเงิน</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุกสถานะ</option>
            <option value="รอตรวจ">รอตรวจ</option>
            <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
            <option value="ปฏิเสธ">ปฏิเสธ</option>
          </select>
        </div>

        {/* การ์ดสรุป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">ยอดที่ยืนยันแล้ว (บาท)</h2>
            <p className="text-3xl font-bold text-green-600">{money(summary.confirmedTotal)}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">รายการรอตรวจสอบ</h2>
            <p className="text-3xl font-bold text-yellow-600">{summary.pendingCount}</p>
          </div>
        </div>

        {/* ตารางรายการชำระ */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">บิล</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">ห้อง</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">ผู้เช่า</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase">วิธีชำระ</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">สลิป</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      INV-{new Date(p.payment_date).getFullYear()}-{String(p.invoice_id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 text-gray-800">{p.room_number}</td>
                    <td className="px-4 py-3 text-gray-600">{p.guest_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{money(p.amount_paid)}</td>
                    <td className="px-4 py-3 text-gray-700">{p.payment_method}</td>
                    <td className="px-4 py-3 text-center">
                      {p.payment_evidence ? (
                        <button
                          onClick={() => setSlipUrl(p.payment_evidence)}
                          className="text-blue-600 hover:text-blue-900 underline"
                        >
                          ดูสลิป
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(p.payment_status)}`}>
                        {p.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      {/* ยืนยัน/ปฏิเสธ ได้เฉพาะรายการที่ยังรอตรวจ */}
                      {p.payment_status === 'รอตรวจ' ? (
                        <>
                          <button
                            onClick={() => handleVerify(p.payment_id, 'approve')}
                            className="text-sm text-green-600 hover:text-green-900"
                          >
                            ยืนยัน
                          </button>
                          <button
                            onClick={() => handleVerify(p.payment_id, 'reject')}
                            className="text-sm text-red-600 hover:text-red-900"
                          >
                            ปฏิเสธ
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-500">
                      ไม่พบรายการชำระเงิน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal ดูสลิป */}
      {slipUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSlipUrl(null)}
        >
          <div className="bg-white rounded-xl shadow-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-gray-800">สลิปการโอนเงิน</h2>
              <button onClick={() => setSlipUrl(null)} className="text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <img src={slipUrl} alt="สลิปการโอนเงิน" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}

export default Money;
