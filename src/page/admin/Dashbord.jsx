import React, { useState, useEffect } from 'react';
import api from '../../lib/api';

// helper แสดงเงินรูปแบบ 1,234.00
const fmtMoney = (val) =>
  Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// จัดรูปแบบวันที่เป็น YYYY-MM-DD จากเวลาท้องถิ่น (ไม่ใช้ toISOString เพราะจะเลื่อนเป็น UTC → วันเพี้ยน)
const fmtDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// วันที่วันนี้ + วันแรกของเดือน ใช้เป็นค่าเริ่มต้นช่วงเวลาสถิติผู้เข้าพัก
const todayStr = () => fmtDate(new Date());
const monthStartStr = () => {
  const now = new Date();
  return fmtDate(new Date(now.getFullYear(), now.getMonth(), 1));
};

const Dashbord = () => {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [occupancy, setOccupancy] = useState([]);
  const [debt, setDebt] = useState([]);
  const [loading, setLoading] = useState(true);

  // สถิติผู้เข้าพักตามช่วงเวลา (เลือกช่วงได้)
  const [occStats, setOccStats] = useState({ daily: 0, monthly: 0 });
  const [occStart, setOccStart] = useState(monthStartStr());
  const [occEnd, setOccEnd] = useState(todayStr());

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

  // โหลดสถิติผู้เข้าพักใหม่ทุกครั้งที่ช่วงเวลาเปลี่ยน
  useEffect(() => {
    const fetchOccStats = async () => {
      try {
        const res = await api.get(`/dashboard/occupancy-stats?start=${occStart}&end=${occEnd}`);
        if (res.data.success) setOccStats(res.data.data);
      } catch (err) {
        console.error('โหลดสถิติผู้เข้าพักไม่สำเร็จ:', err);
      }
    };
    fetchOccStats();
  }, [occStart, occEnd]);

  if (loading) {
    return <div className="text-center py-20 text-muted-foreground">กำลังโหลดข้อมูล...</div>;
  }

  // หาค่ารายได้สูงสุดของแต่ละแท่ง (รายวัน/รายเดือน) ไว้คิดสัดส่วนความสูง (กันหาร 0)
  const maxRevenue = Math.max(
    ...revenue.map((r) => r.revenueDaily),
    ...revenue.map((r) => r.revenueMonthly),
    1
  );

  return (
    <div className="flex w-full flex-col bg-background p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">แดชบอร์ด</h1>

      {/* แจ้งเตือน: ยังมีห้องที่ยังไม่จดมิเตอร์เดือนนี้ (กันลืมก่อนออกบิล) */}
      {summary && summary.unrecordedMeters > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-3 mb-6 font-medium">
          ⚠️ ยังมี {summary.unrecordedMeters} ห้องที่ยังไม่จดมิเตอร์เดือนนี้ — กรุณาจดให้ครบก่อนออกบิล
        </div>
      )}

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

      {/* ===== ห้องว่างวันนี้ แยกรายวัน / รายเดือน ===== */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* ห้องว่างสำหรับรายวัน (วันนี้) */}
          <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">ห้องว่างวันนี้ (รายวัน)</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{summary.availableDaily} ห้อง</p>
            {/* แยกตามประเภทห้อง */}
            {summary.availableDailyByType?.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-teal-100 dark:border-teal-900 space-y-1">
                {summary.availableDailyByType.map((t) => (
                  <li key={t.type_name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.type_name}</span>
                    <span className="font-bold text-foreground">{t.count} ห้อง</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-3">ไม่มีการจองคาบเกี่ยววันนี้ · รับผู้เช่ารายวันได้</p>
          </div>

          {/* ห้องว่างสำหรับรายเดือน */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">ห้องว่าง (รายเดือน)</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{summary.availableMonthly} ห้อง</p>
            {/* แยกตามประเภทห้อง */}
            {summary.availableMonthlyByType?.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900 space-y-1">
                {summary.availableMonthlyByType.map((t) => (
                  <li key={t.type_name} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t.type_name}</span>
                    <span className="font-bold text-foreground">{t.count} ห้อง</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground mt-3">ไม่มีผู้เช่ารายเดือนพักอยู่ · เสนอสัญญารายเดือนได้</p>
          </div>
        </div>
      )}

      {/* ===== กราฟรายได้รายเดือน (แยกรายวัน/รายเดือน) ===== */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-semibold text-foreground">รายได้ย้อนหลัง 6 เดือน</h2>
          {/* คำอธิบายสีของแท่งกราฟ */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-sky-500"></span>รายวัน
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary"></span>รายเดือน
            </span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 h-52">
          {revenue.map((r) => (
            <div key={r.month} className="flex h-full flex-1 flex-col items-center">
              {/* พื้นที่แท่ง — flex-1 ทำให้มีความสูงชัดเจน แท่งจึงคิด % ได้ถูก, justify-end ดันแท่งชิดล่าง */}
              <div className="flex w-full flex-1 items-end justify-center gap-1">
                {/* แท่งรายวัน */}
                <div className="flex flex-1 flex-col items-center justify-end h-full max-w-[24px]">
                  <span className="text-[10px] text-muted-foreground mb-1">{fmtMoney(r.revenueDaily)}</span>
                  <div
                    className="w-full bg-sky-500 rounded-t"
                    style={{ height: `${(r.revenueDaily / maxRevenue) * 100}%` }}
                  ></div>
                </div>
                {/* แท่งรายเดือน */}
                <div className="flex flex-1 flex-col items-center justify-end h-full max-w-[24px]">
                  <span className="text-[10px] text-muted-foreground mb-1">{fmtMoney(r.revenueMonthly)}</span>
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${(r.revenueMonthly / maxRevenue) * 100}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-2">{r.month}</span>
            </div>
          ))}
          {revenue.length === 0 && (
            <p className="text-center w-full text-muted-foreground">ยังไม่มีข้อมูลรายได้</p>
          )}
        </div>
      </div>

      {/* ===== สถิติผู้เข้าพัก แยกรายวัน/รายเดือน ตามช่วงเวลา ===== */}
      <div className="bg-card shadow-sm border border-border rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <h2 className="text-lg font-semibold text-foreground">จำนวนผู้เข้าพักตามช่วงเวลา</h2>
          {/* เลือกช่วงเวลา */}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ตั้งแต่</label>
              <input
                type="date"
                value={occStart}
                max={occEnd}
                onChange={(e) => setOccStart(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 bg-muted/50 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">ถึง</label>
              <input
                type="date"
                value={occEnd}
                min={occStart}
                onChange={(e) => setOccEnd(e.target.value)}
                className="border border-border rounded-lg px-3 py-1.5 bg-muted/50 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* รายวัน */}
          <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-100 dark:border-teal-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">ผู้เข้าพัก — รายวัน</p>
            <p className="text-2xl font-bold text-teal-600 mt-1">{occStats.daily} ราย</p>
          </div>
          {/* รายเดือน */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-5">
            <p className="text-sm text-muted-foreground">ผู้เข้าพัก — รายเดือน</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">{occStats.monthly} ราย</p>
          </div>
          {/* รวม */}
          <div className="bg-muted/40 border border-border rounded-xl p-5">
            <p className="text-sm text-muted-foreground">รวมทั้งหมด</p>
            <p className="text-2xl font-bold text-foreground mt-1">{occStats.daily + occStats.monthly} ราย</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">นับการจองที่เข้าพักคาบเกี่ยวช่วงเวลาที่เลือก (เช็คอินแล้ว/ย้ายออกแล้ว)</p>
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
