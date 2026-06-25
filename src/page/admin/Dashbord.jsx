import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

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
          api.get('/dashboard/summary'),
          api.get('/dashboard/revenue?months=6'),
          api.get('/dashboard/occupancy'),
          api.get('/dashboard/debt'),
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
    return <div className="text-center py-20 text-muted-foreground">กำลังโหลดข้อมูล...</div>;
  }

  // หาค่ารายได้สูงสุดไว้คิดสัดส่วนความสูงแท่งกราฟ (กันหาร 0)
  const maxRevenue = Math.max(...revenue.map((r) => r.revenue), 1);

  return (
    <div className="flex w-full flex-col bg-background p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">แดชบอร์ด</h1>

      {/* ===== การ์ดสรุป ===== */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* รายได้เดือนนี้ */}
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">รายได้เดือนนี้</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmtMoney(summary.revenueThisMonth)} บ.</p>
          </div>

          {/* ห้องมีผู้เช่า / ทั้งหมด */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">ห้องมีผู้เช่า</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {summary.rooms.occupied} / {summary.rooms.total}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              ว่าง {summary.rooms.vacant} · ปิดปรับปรุง {summary.rooms.maintenance}
            </p>
          </div>

          {/* หนี้ค้างชำระ */}
          <div className="bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">หนี้ค้างชำระ</p>
            <p className="text-2xl font-bold text-destructive mt-1">{fmtMoney(summary.outstandingDebt)} บ.</p>
            <p className="text-xs text-muted-foreground mt-1">{summary.unpaidInvoices} บิลค้างชำระ</p>
          </div>

          {/* แจ้งซ่อมค้าง */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">แจ้งซ่อมค้าง</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{summary.pendingRepairs} รายการ</p>
          </div>
        </div>
      )}

      {/* ===== กราฟรายได้รายเดือน ===== */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">รายได้ย้อนหลัง 6 เดือน</h2>
        <div className="flex items-end justify-between gap-3 h-48">
          {revenue.map((r) => (
            <div key={r.month} className="flex flex-col items-center flex-1">
              <span className="text-xs text-muted-foreground mb-1">{fmtMoney(r.revenue)}</span>
              {/* ความสูงแท่ง = สัดส่วนเทียบรายได้สูงสุด */}
              <div
                className="w-full bg-primary rounded-t"
                style={{ height: `${(r.revenue / maxRevenue) * 100}%` }}
              ></div>
              <span className="text-xs text-muted-foreground mt-2">{r.month}</span>
            </div>
          ))}
          {revenue.length === 0 && (
            <p className="text-center w-full text-muted-foreground">ยังไม่มีข้อมูลรายได้</p>
          )}
        </div>
      </div>

      {/* ===== รายงาน 2 คอลัมน์: ผู้เข้าพัก / หนี้ค้างชำระ ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* รายงานผู้เข้าพักปัจจุบัน */}
        <div className="bg-card shadow-sm border border-border rounded-lg overflow-x-auto">
          <h2 className="text-lg font-semibold text-foreground px-4 pt-4">ผู้เข้าพักปัจจุบัน</h2>
          <table className="min-w-full divide-y divide-border text-sm mt-3">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ผู้เช่า</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground uppercase tracking-wider">ประเภท</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">เข้าพัก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {occupancy.map((o) => (
                <tr key={o.booking_id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{o.room_number}</td>
                  <td className="px-4 py-3 text-foreground">{o.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-center text-foreground">
                    {o.rent_type === 'monthly' ? 'รายเดือน' : 'รายวัน'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {o.check_in_date ? new Date(o.check_in_date).toLocaleDateString('th-TH') : '—'}
                  </td>
                </tr>
              ))}
              {occupancy.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted-foreground">ไม่มีผู้เข้าพัก</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* รายงานหนี้ค้างชำระ */}
        <div className="bg-card shadow-sm border border-border rounded-lg overflow-x-auto">
          <h2 className="text-lg font-semibold text-foreground px-4 pt-4">หนี้ค้างชำระ</h2>
          <table className="min-w-full divide-y divide-border text-sm mt-3">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ห้อง</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ผู้เช่า</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground uppercase tracking-wider">ครบกำหนด</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground uppercase tracking-wider">ค้างชำระ (บ.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {debt.map((d) => (
                <tr key={d.invoice_id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{d.room_number}</td>
                  <td className="px-4 py-3 text-foreground">{d.tenant_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {d.due_date ? new Date(d.due_date).toLocaleDateString('th-TH') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-destructive font-medium">{fmtMoney(d.outstanding)}</td>
                </tr>
              ))}
              {debt.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-muted-foreground">ไม่มีหนี้ค้างชำระ</td>
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
