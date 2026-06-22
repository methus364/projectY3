import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

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
  const [qr, setQr] = useState(null);                 // ข้อมูล QR { qrImage, amount }
  const [slipFile, setSlipFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ==========================================
  // โหลดบิลของตัวเอง
  // ==========================================
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/my-invoices`, getAuthHeader());
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
    try {
      const res = await axios.get(`${API}/invoice/${invoice.invoice_id}/promptpay`, getAuthHeader());
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

      const res = await axios.post(`${API}/payment`, form, {
        headers: {
          ...getAuthHeader().headers,
          'Content-Type': 'multipart/form-data',
        },
      });
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

  // เปิด PDF บิล (แนบ token จึงต้องดึงเป็น blob)
  const openPdf = async (invoiceId) => {
    try {
      const res = await axios.get(`${API}/invoice/${invoiceId}/pdf`, {
        ...getAuthHeader(),
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(res.data);
      window.open(url, '_blank');
    } catch (err) {
      console.error('เปิด PDF ไม่สำเร็จ:', err);
      alert('เปิด PDF ไม่สำเร็จ');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">บิลค่าเช่าของฉัน</h1>

        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            ยังไม่มีใบแจ้งหนี้
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.invoice_id} className="bg-white rounded-xl shadow p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-800">
                      INV-{new Date(inv.invoice_date).getFullYear()}-{String(inv.invoice_id).padStart(4, '0')}
                    </p>
                    <p className="text-sm text-gray-500">
                      ห้อง {inv.room_number} · ครบกำหนด {inv.due_date?.split('T')[0] || '-'}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(inv.invoice_status)}`}>
                    {inv.invoice_status}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t pt-3">
                  <p className="text-lg font-bold text-gray-900">{money(inv.total_amount)} บาท</p>
                  <div className="space-x-3">
                    <button
                      onClick={() => openPdf(inv.invoice_id)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      ดูบิล (PDF)
                    </button>
                    {/* แจ้งชำระได้เฉพาะบิลที่ยังไม่ชำระครบ */}
                    {inv.invoice_status !== 'ชำระแล้ว' && inv.invoice_status !== 'ยกเลิก' && (
                      <button
                        onClick={() => openPay(inv)}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg transition"
                      >
                        แจ้งชำระเงิน
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← ย้อนกลับ
        </button>
      </div>

      {/* Modal แจ้งชำระเงิน */}
      {payInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-1">แจ้งชำระเงิน</h2>
            <p className="text-sm text-gray-500 mb-4">
              ห้อง {payInvoice.room_number} · ยอด {money(payInvoice.total_amount)} บาท
            </p>

            {/* QR PromptPay (ถ้าหอพักตั้งค่าไว้) */}
            {qr ? (
              <div className="text-center mb-4">
                <img src={qr.qrImage} alt="QR PromptPay" className="mx-auto w-56 h-56" />
                <p className="text-sm text-gray-600 mt-1">
                  สแกนเพื่อโอน {money(qr.amount)} บาท
                </p>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg text-sm text-center">
                ยังไม่มี QR พร้อมเพย์ — โอนตามช่องทางหอพักแล้วแนบสลิปด้านล่าง
              </div>
            )}

            {/* แนบสลิป */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                แนบสลิปการโอนเงิน <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSlipFile(e.target.files[0] || null)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setPayInvoice(null)}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmitPayment}
                disabled={submitting}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {submitting ? 'กำลังส่ง...' : 'ส่งแจ้งชำระ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
