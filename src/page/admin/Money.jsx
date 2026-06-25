import React, { useState, useEffect, useMemo } from 'react';
import api from '../../lib/api';

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

      const res = await api.get(`/payments?${params.toString()}`);
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
      const res = await api.put(`/payment/${paymentId}/verify`, { action });
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
      <div className="flex w-full flex-col bg-background p-6">

        {/* ส่วนหัว + filter */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-foreground">ตรวจสอบการชำระเงิน</h1>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">ทุกสถานะ</option>
            <option value="รอตรวจ">รอตรวจ</option>
            <option value="ยืนยันแล้ว">ยืนยันแล้ว</option>
            <option value="ปฏิเสธ">ปฏิเสธ</option>
          </select>
        </div>

        {/* การ์ดสรุป */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-card shadow-md rounded-lg p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">ยอดที่ยืนยันแล้ว (บาท)</h2>
            <p className="text-3xl font-bold text-green-600">{money(summary.confirmedTotal)}</p>
          </div>
          <div className="bg-card shadow-md rounded-lg p-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-2">รายการรอตรวจสอบ</h2>
            <p className="text-3xl font-bold text-yellow-600">{summary.pendingCount}</p>
          </div>
        </div>

        {/* ตารางรายการชำระ */}
        <div className="bg-card shadow-md rounded-lg overflow-x-auto">
          {loading ? (
            <div className="text-center py-10 text-muted-foreground">กำลังโหลดข้อมูล...</div>
          ) : (
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">บิล</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ห้อง</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">ผู้เช่า</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">จำนวนเงิน</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase">วิธีชำระ</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">สลิป</th>
                  <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase">สถานะ</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.payment_id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground whitespace-nowrap">
                      INV-{new Date(p.payment_date).getFullYear()}-{String(p.invoice_id).padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 text-foreground">{p.room_number}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.guest_name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">{money(p.amount_paid)}</td>
                    <td className="px-4 py-3 text-foreground">{p.payment_method}</td>
                    <td className="px-4 py-3 text-center">
                      {p.payment_evidence ? (
                        <button
                          onClick={() => setSlipUrl(p.payment_evidence)}
                          className="text-primary hover:text-primary/70 underline"
                        >
                          ดูสลิป
                        </button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
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
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}

                {payments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-muted-foreground">
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
          <div className="bg-card rounded-xl shadow-xl p-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold text-foreground">สลิปการโอนเงิน</h2>
              <button onClick={() => setSlipUrl(null)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>
            <img src={slipUrl} alt="สลิปการโอนเงิน" className="w-full rounded-lg" />
          </div>
        </div>
      )}
    </>
  );
}

export default Money;
