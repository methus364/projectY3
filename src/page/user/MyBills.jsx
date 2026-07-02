import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import Navbar from '../../components/user/Navbar';
import PageHeader from '../../components/user/PageHeader';

const money = (val) => (Number(val) || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 });

// สีป้ายสถานะบิล
const statusBadge = (status) => {
  if (status === 'ชำระแล้ว') return 'bg-green-100 text-green-700';
  if (status === 'ชำระบางส่วน') return 'bg-blue-100 text-blue-700';
  if (status === 'ยกเลิก') return 'bg-gray-200 text-gray-600';
  return 'bg-yellow-100 text-yellow-700'; // ยังไม่ชำระ
};

export default function MyBills() {
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // modal แจ้งชำระเงิน
  const [payInvoice, setPayInvoice] = useState(null); // บิลที่กำลังจะชำระ
  const [qr, setQr] = useState(null);                 // ข้อมูล QR พร้อมเพย์แบบเดิม { qrImage, amount }
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // จ่ายด้วย QR อัตโนมัติผ่าน Omise
  const [qrCharge, setQrCharge] = useState(null);     // { paymentId, qrImage, amount }
  const [qrPaid, setQrPaid] = useState(false);

  // ==========================================
  // โหลดบิลของตัวเอง
  // ==========================================
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/my-invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      console.error('โหลดบิลไม่สำเร็จ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchInvoices();
  }, [navigate]);

  // ==========================================
  // เปิด modal แจ้งชำระ — ขอ QR PromptPay ของบิลนั้น
  // ==========================================
  const openPay = async (invoice) => {
    setPayInvoice(invoice);
    setSlipFile(null);
    setQr(null);
    setQrCharge(null);
    setQrPaid(false);
    try {
      const res = await api.get(`/invoice/${invoice.invoice_id}/promptpay`);
      if (res.data.success) {
        setQr(res.data.data);
      }
    } catch (err) {
      // ถ้าหอพักยังไม่ตั้งค่า PromptPay ก็ยังอัปสลิปได้อยู่ แค่ไม่มี QR ให้สแกน
      console.error('ขอ QR ไม่สำเร็จ:', err);
    }
  };

  // ==========================================
  // ส่งแจ้งชำระ + แนบสลิป
  // ==========================================
  const handleSubmitPayment = async () => {
    if (!slipFile) {
      alert('กรุณาแนบสลิปการโอนเงิน');
      return;
    }
    try {
      setSubmitting(true);
      // ส่งเป็น multipart/form-data (มีไฟล์สลิป)
      const form = new FormData();
      form.append('invoice_id', payInvoice.invoice_id);
      form.append('payment_method', 'โอนเงิน');
      form.append('slip', slipFile);

      // ไม่ตั้ง Content-Type เอง — ให้ browser ใส่ multipart/form-data พร้อม boundary ให้อัตโนมัติ
      // (ถ้าตั้งเองโดยไม่มี boundary ฝั่ง server จะแยกไฟล์สลิปไม่ได้)
      const res = await api.post('/payment', form);
      if (res.data.success) {
        alert(res.data.message);
        setPayInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'แจ้งชำระไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // จ่ายด้วย QR อัตโนมัติ (Omise) — สร้าง charge แล้วโชว์ QR ให้สแกน
  // ==========================================
  const startQrPay = async () => {
    try {
      setSubmitting(true);
      const res = await api.post(`/invoice/${payInvoice.invoice_id}/qr-charge`);
      if (res.data.success) {
        setQrCharge(res.data.data); // { paymentId, qrImage, amount }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'สร้าง QR ไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  // poll ถาม backend ว่าจ่าย QR สำเร็จหรือยัง (ทุก 3 วินาที จนกว่าจะจ่ายหรือปิด modal)
  useEffect(() => {
    if (!qrCharge || qrPaid) return;

    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/payment/${qrCharge.paymentId}/qr-status`);
        if (res.data.success && res.data.data.paid) {
          setQrPaid(true);
          clearInterval(timer);
          fetchInvoices(); // รีเฟรชสถานะบิล
        }
      } catch {
        // ถ้า poll พลาดชั่วคราว ปล่อยให้รอบถัดไปลองใหม่
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [qrCharge, qrPaid]);

  // เปิด PDF บิล (แนบ token จึงต้องดึงเป็น blob)
  const openPdf = async (invoiceId) => {
    try {
      const res = await api.get(`/invoice/${invoiceId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (err) {
      console.error('เปิด PDF ไม่สำเร็จ:', err);
      alert('เปิด PDF ไม่สำเร็จ');
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
      <PageHeader title="บิลค่าเช่าของฉัน" subtitle="รายการใบแจ้งหนี้และการชำระเงิน" />

      <div className="pt-6 pb-10 px-4 max-w-2xl mx-auto">

        {invoices.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-10 text-center">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-[#64748B] font-semibold">ยังไม่มีใบแจ้งหนี้</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.invoice_id} className="bg-white rounded-3xl shadow-sm border border-[#E2E8F0] p-5">
                {/* หัว: เลขบิล + สถานะ */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-[#1E293B] font-black text-base">
                      INV-{new Date(inv.invoice_date).getFullYear()}-{String(inv.invoice_id).padStart(4, '0')}
                    </p>
                    <p className="text-[#64748B] text-sm mt-0.5">
                      ห้อง {inv.room_number} · ครบกำหนด {inv.due_date?.split('T')[0] || '-'}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${statusBadge(inv.invoice_status)}`}>
                    {inv.invoice_status}
                  </span>
                </div>

                {/* ยอดรวม */}
                <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3 mb-3">
                  <p className="text-[#94A3B8] text-xs font-semibold">ยอดรวม</p>
                  <p className="text-[#1E293B] font-black text-xl">{money(inv.total_amount)} <span className="text-sm font-semibold text-[#64748B]">บาท</span></p>
                </div>

                {/* ปุ่ม */}
                <div className="flex gap-3">
                  <button
                    onClick={() => openPdf(inv.invoice_id)}
                    className="flex-1 py-2.5 bg-[#F1F5F9] text-[#334155] font-bold text-sm rounded-2xl hover:bg-[#E2E8F0] transition"
                  >
                    ดูบิล PDF
                  </button>
                  {/* แจ้งชำระได้เฉพาะบิลที่ยังไม่ชำระครบ */}
                  {inv.invoice_status !== 'ชำระแล้ว' && inv.invoice_status !== 'ยกเลิก' && (
                    <button
                      onClick={() => openPay(inv)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-2xl transition"
                    >
                      แจ้งชำระเงิน
                    </button>
                  )}
                </div>
              </div>
            ))}
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

      {/* Modal แจ้งชำระเงิน */}
      {payInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[#1E293B] text-lg font-black">แจ้งชำระเงิน</h2>
              <button
                onClick={() => setPayInvoice(null)}
                className="w-8 h-8 bg-[#F1F5F9] rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl px-4 py-3 mb-4">
              <p className="text-[#64748B] text-sm">ห้อง {payInvoice.room_number}</p>
              <p className="text-[#1E293B] font-black text-xl">{money(payInvoice.total_amount)} <span className="text-sm font-semibold text-[#64748B]">บาท</span></p>
            </div>

            {/* ===== โหมดจ่าย QR อัตโนมัติ (Omise) ===== */}
            {qrPaid ? (
              // จ่ายสำเร็จแล้ว
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-[#DCFCE7] rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl text-[#16A34A]">✓</span>
                </div>
                <p className="text-[#16A34A] font-black text-lg">ชำระเงินสำเร็จ!</p>
                <p className="text-[#64748B] text-sm mt-1">ระบบยืนยันการชำระอัตโนมัติแล้ว</p>
                <button
                  onClick={() => setPayInvoice(null)}
                  className="mt-5 w-full py-3 bg-[#5A2D82] hover:bg-[#46236A] text-white font-bold rounded-2xl transition"
                >
                  เสร็จสิ้น
                </button>
              </div>
            ) : qrCharge ? (
              // แสดง QR ให้สแกน + รอยืนยัน
              <div className="text-center">
                <img src={qrCharge.qrImage} alt="QR PromptPay" className="mx-auto w-56 h-56 rounded-2xl border border-[#E2E8F0]" />
                <p className="text-[#1E293B] font-black text-lg mt-2">สแกนจ่าย {money(qrCharge.amount)} บาท</p>
                <p className="text-[#64748B] text-sm mt-1 flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 bg-[#5A2D82] rounded-full animate-pulse" />
                  กำลังรอการชำระเงิน... (ยืนยันอัตโนมัติ)
                </p>
                <button
                  onClick={() => setPayInvoice(null)}
                  className="mt-4 w-full py-2.5 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition"
                >
                  ปิด
                </button>
              </div>
            ) : (
            <>
            {/* ปุ่มเลือกจ่าย QR อัตโนมัติ (แนะนำ) */}
            <button
              onClick={startQrPay}
              disabled={submitting}
              className="w-full py-3 mb-4 bg-[#5A2D82] hover:bg-[#46236A] text-white font-black rounded-2xl transition disabled:opacity-50"
            >
              {submitting ? 'กำลังสร้าง QR...' : '⚡ จ่ายด้วย QR อัตโนมัติ (ยืนยันทันที)'}
            </button>

            <div className="flex items-center my-3">
              <div className="flex-grow border-t border-[#E2E8F0]" />
              <span className="px-3 text-xs text-[#94A3B8] font-semibold">หรือแจ้งโอน + แนบสลิป</span>
              <div className="flex-grow border-t border-[#E2E8F0]" />
            </div>

            {/* QR PromptPay แบบเดิม (แจ้งโอน + แนบสลิป ให้แอดมินตรวจ) */}
            {qr ? (
              <div className="text-center mb-4">
                <img src={qr.qrImage} alt="QR PromptPay" className="mx-auto w-52 h-52 rounded-2xl" />
                <p className="text-sm text-[#64748B] font-semibold mt-2">
                  สแกนเพื่อโอน {money(qr.amount)} บาท
                </p>
              </div>
            ) : (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-3 text-sm text-yellow-800 font-semibold text-center">
                ยังไม่มี QR พร้อมเพย์ — โอนตามช่องทางหอพักแล้วแนบสลิปด้านล่าง
              </div>
            )}

            {/* แนบสลิป */}
            <div className="mb-5">
              <label className="block text-[#334155] text-sm font-bold mb-2">
                แนบสลิปการโอนเงิน <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSlipFile(e.target.files[0] || null)}
                className="w-full text-sm border border-[#CBD5E1] rounded-2xl px-3 py-2.5 bg-[#F8FAFC]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setPayInvoice(null)}
                className="flex-1 py-3 bg-[#F1F5F9] text-[#64748B] font-bold rounded-2xl hover:bg-[#E2E8F0] transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl transition disabled:opacity-50"
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งแจ้งชำระ'}
              </button>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
