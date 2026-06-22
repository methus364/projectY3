import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// helper แสดงเงินรูปแบบ 1,234.00
const fmtMoney = (val) =>
  Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Dashbord = () => {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [debt, setDebt] = useState([]);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // โหลดข้อมูลทั้งหมดของแดชบอร์ดพร้อมกัน
  // ==========================================
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [sumRes, revRes, occRes, debtRes] = await Promise.all([
          axios.get(`${API}/dashboard/summary`, getAuthHeader()),
          axios.get(`${API}/dashboard/revenue?months=6`, getAuthHeader()),
          axios.get(`${API}/dashboard/occupancy`, getAuthHeader()),
          axios.get(`${API}/dashboard/debt`, getAuthHeader()),
        ]);
        if (sumRes.data.success) setSummary(sumRes.data.data);
        if (revRes.data.success) setRevenue(revRes.data.data);
        if (occRes.data.success) setOccupancy(occRes.data.data);
        if (debtRes.data.success) setDebt(debtRes.data.data);
      } catch (err) {
        console.error('โหลดข้อมูลแดชบอร์ดไม่สำเร็จ:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>;
  }

  // หาค่ารายได้สูงสุดไว้คิดสัดส่วนความสูงแท่งกราฟ (กันหาร 0)
  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);

  return (
    <div className="flex w-full flex-col bg-white p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">แดชบอร์ด</h1>

      {/* ===== การ์ดสรุป ===== */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* รายได้เดือนนี้ */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-5">
            <p className="text-sm text-gray-500">รายได้เดือนนี้</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmtMoney(summary.revenueThisMonth)} บ.</p>
          </div>

          {/* ห้องมีผู้เช่า / ทั้งหมด */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-sm text-gray-500">ห้องมีผู้เช่า</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {summary.rooms.occupied} / {summary.rooms.total}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ว่าง {summary.rooms.vacant} · ปิดปรับปรุง {summary.rooms.maintenance}
            </p>
          </div>

          {/* หนี้ค้างชำระ */}
          <div className="bg-red-50 border border-red-100 rounded-xl p-5">
            <p className="text-sm text-gray-500">หนี้ค้างชำระ</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{fmtMoney(summary.outstandingDebt)} บ.</p>
            <p className="text-xs text-gray-400 mt-1">{summary.unpaidInvoices} บิลค้างชำระ</p>
          </div>

          {/* แจ้งซ่อมค้าง */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
            <p className="text-sm text-gray-500">แจ้งซ่อมค้าง</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingRepairs} รายการ</p>
          </div>
        </div>
      )}

      {/* ===== กราฟรายได้รายเดือน (รายงานการเงิน) ===== */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">รายได้ย้อนหลัง 6 เดือน</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {revenue.map((r) => (
            <div key={r.month} className="flex flex-col items-center flex-1">
              <span className="text-xs text-gray-500 mb-1">{fmtMoney(r.revenue)}</span>
              {/* ความสูงแท่ง = สัดส่วนเทียบรายได้สูงสุด */}
              <div
                className="w-full bg-indigo-500 rounded-t"
                style={{ height: `${(r.revenue / maxRevenue) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-600 mt-2">{r.month}</span>
            </div>
          ))}
          {revenue.length === 0 && (
            <p className="text-center w-full text-gray-500">ยังไม่มีข้อมูลรายได้</p>
          )}
        </div>
      </div>

      {/* ===== รายงาน 2 คอลัมน์: ผู้เข้าพัก / หนี้ค้างชำระ ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* รายงานผู้เข้าพักปัจจุบัน */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-800 px-4 pt-4">ผู้เข้าพักปัจจุบัน</h2>
          <table className="min-w-full divide-y divide-gray-200 text-sm mt-3">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ผู้เช่า</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">เข้าพัก</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {occupancy.map((o) => (
                <tr key={o.booking_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.room_number}</td>
                  <td className="px-4 py-3 text-gray-700">{o.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-center text-gray-700">
                    {o.rent_type === 'monthly' ? 'รายเดือน' : 'รายวัน'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {o.check_in_date ? new Date(o.check_in_date).toLocaleDateString('th-TH') : '—'}
                  </td>
                </tr>
              ))}
              {occupancy.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">ไม่มีผู้เข้าพัก</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* รายงานหนี้ค้างชำระ */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <h2 className="text-lg font-semibold text-gray-800 px-4 pt-4">หนี้ค้างชำระ</h2>
          <table className="min-w-full divide-y divide-gray-200 text-sm mt-3">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ผู้เช่า</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ครบกำหนด</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">ค้างชำระ (บ.)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {debt.map((d) => (
                <tr key={d.invoice_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.room_number}</td>
                  <td className="px-4 py-3 text-gray-700">{d.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString('th-TH') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-red-600 font-medium">{fmtMoney(d.outstanding)}</td>
                </tr>
              ))}
              {debt.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">ไม่มีหนี้ค้างชำระ</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashbord;
