import React, { useState, useMemo } from 'react';

// --- ข้อมูลสมมติ (Mock Data) ---
const mockTransactions = [
  { id: 1, date: '2025-11-09', description: 'ค่าเช่าห้อง 101 (เดือน พ.ย.)', type: 'Income', amount: 4500, note: 'โอนผ่าน SCB', paymentMethod: 'โอน' },
  { id: 2, date: '2025-11-08', description: 'ค่าเช่าห้อง 102 (เดือน พ.ย.)', type: 'Income', amount: 4500, note: 'จ่ายเงินสดที่เคาน์เตอร์', paymentMethod: 'เงินสด' },
  { id: 3, date: '2025-11-05', description: 'ค่าจ้างแม่บ้านทำความสะอาด', type: 'Expense', amount: 1200, note: 'รอบบิล 1-5 พ.ย.', paymentMethod: 'โอน' },
  { id: 4, date: '2025-11-09', description: 'ค่าน้ำประปา (รอบบิล ต.ค.)', type: 'Expense', amount: 850, note: '', paymentMethod: 'โอน' },
  { id: 5, date: '2025-11-01', description: 'ซื้อหลอดไฟเปลี่ยนทางเดิน', type: 'Expense', amount: 300, note: 'ร้านช่างไฟหน้าหอ', paymentMethod: 'เงินสด' },
];
// ---------------------------------

// --- (ฟังก์ชัน Helper) ---

// ป้ายประเภท (รายรับ/รายจ่าย)
const renderTypeBadge = (type) => {
  if (type === 'Income') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        รายรับ
      </span>
    );
  }
  return (
    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
      รายจ่าย
    </span>
  );
};

// ป้ายช่องทางการชำระเงิน
const renderPaymentMethod = (method) => {
  if (method === 'โอน') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
        โอน
      </span>
    );
  }
  if (method === 'เงินสด') {
    return (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
        เงินสด
      </span>
    );
  }
  // กรณีอื่นๆ (ถ้ามี)
  return (
    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
      {method || 'N/A'}
    </span>
  );
};

// จัดรูปแบบตัวเลข
const formatNumber = (num) => {
  // ใช้ toLocaleString เพื่อใส่ comma และ .00
  // ถ้าไม่ต้องการทศนิยม ใช้ { maximumFractionDigits: 0 }
  return num.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};
// ---------------------------------


function Money() {
  const [transactions, setTransactions] = useState(mockTransactions);
  
  // State สำหรับเก็บ "ช่วงวันที่"
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // ฟังก์ชันอัปเดต State ช่วงวันที่
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // กรองรายการตาม "ช่วงวันที่"
  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = dateRange;
    
    // ถ้าไม่กำหนดค่าใดเลย
    if (!startDate && !endDate) {
      return transactions;
    }

    return transactions.filter((t) => {
      const tDate = t.date;
      // กรณี 1: มีแค่วันที่เริ่มต้น
      if (startDate && !endDate) {
        return tDate >= startDate;
      }
      // กรณี 2: มีแค่วันที่สิ้นสุด
      if (!startDate && endDate) {
        return tDate <= endDate;
      }
      // กรณี 3: มีทั้งคู่
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, dateRange]);


  // คำนวณสรุปยอด (แยกตามช่องทาง)
  const summary = useMemo(() => {
    // ใช้ .reduce() เพื่อวน loop แค่ครั้งเดียว
    const stats = filteredTransactions.reduce((acc, t) => {
      if (t.type === 'Income') {
        acc.totalIncome += t.amount;
        if (t.paymentMethod === 'โอน') {
          acc.incomeByTransfer += t.amount;
        } else if (t.paymentMethod === 'เงินสด') {
          acc.incomeByCash += t.amount;
        }
      } else if (t.type === 'Expense') {
        acc.totalExpense += t.amount;
        if (t.paymentMethod === 'โอน') {
          acc.expenseByTransfer += t.amount;
        } else if (t.paymentMethod === 'เงินสด') {
          acc.expenseByCash += t.amount;
        }
      }
      return acc;
    }, {
      // ค่าเริ่มต้น
      totalIncome: 0,
      incomeByTransfer: 0,
      incomeByCash: 0,
      totalExpense: 0,
      expenseByTransfer: 0,
      expenseByCash: 0,
    });

    const balance = stats.totalIncome - stats.totalExpense;

    return { ...stats, balance };
  }, [filteredTransactions]); // อัปเดตเมื่อ filter เปลี่ยน


  return (
    <div className="p-6">
      
      {/* ส่วนหัวของหน้า + ตัวกรองช่วงวันที่ */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-800">
          บันทึกรายรับ - รายจ่าย
        </h1>
        
        {/* ส่วนควบคุม (ปฏิทิน และ ปุ่ม) */}
        <div className="flex flex-wrap items-center space-x-3">
          
          {/* ปฏิทิน: วันที่เริ่มต้น */}
          <label htmlFor="startDate" className="text-sm font-medium text-gray-700 ml-2">
            จาก:
          </label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={dateRange.startDate}
            onChange={handleDateChange}
            className="border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          {/* ปฏิทิน: วันที่สิ้นสุด */}
          <label htmlFor="endDate" className="text-sm font-medium text-gray-700 ml-2">
            ถึง:
          </label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={dateRange.endDate}
            onChange={handleDateChange}
            className="border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />

          {/* ปุ่มล้าง */}
          {(dateRange.startDate || dateRange.endDate) && (
            <button
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold py-2 px-3 rounded-lg transition duration-300"
            >
              ล้าง
            </button>
          )}
          
          {/* ปุ่มเพิ่มรายการ */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ml-3">
            + เพิ่มรายการใหม่
          </button>
        </div>
      </div>

      {/* ส่วนการ์ดสรุปยอด */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        
        {/* การ์ด: รายรับรวม (พร้อมรายละเอียด) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">รายรับรวม (บาท)</h2>
          <p className="text-3xl font-bold text-green-600 mb-3">
            {formatNumber(summary.totalIncome)}
          </p>
          {/* ส่วนรายละเอียดช่องทาง */}
          <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-blue-600">โอน:</span>
              <span className="font-medium">{formatNumber(summary.incomeByTransfer)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">เงินสด:</span>
              <span className="font-medium">{formatNumber(summary.incomeByCash)}</span>
            </div>
          </div>
        </div>
        
        {/* การ์ด: รายจ่ายรวม (พร้อมรายละเอียด) */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">รายจ่ายรวม (บาท)</h2>
          <p className="text-3xl font-bold text-red-600 mb-3">
            {formatNumber(summary.totalExpense)}
          </p>
          {/* ส่วนรายละเอียดช่องทาง */}
          <div className="text-sm text-gray-700 space-y-1 border-t pt-2">
            <div className="flex justify-between">
              <span className="text-blue-600">โอน:</span>
              <span className="font-medium">{formatNumber(summary.expenseByTransfer)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-yellow-600">เงินสด:</span>
              <span className="font-medium">{formatNumber(summary.expenseByCash)}</span>
            </div>
          </div>
        </div>

        {/* การ์ด: คงเหลือสุทธิ */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-sm font-medium text-gray-500 mb-2">คงเหลือสุทธิ (บาท)</h2>
          <p className="text-3xl font-bold text-gray-800">
            {formatNumber(summary.balance)}
          </p>
          {/* เว้นว่างไว้เพื่อให้ดูสะอาดตา */}
           <div className="text-sm text-gray-700 space-y-1 border-t pt-2 mt-9">
             <div className="flex justify-between invisible">
               <span>-</span><span>-</span>
             </div>
             <div className="flex justify-between invisible">
               <span>-</span><span>-</span>
             </div>
           </div>
        </div>
      </div>

      {/* ตารางแสดงรายการ */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                วันที่
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                รายการ / โน๊ต
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ประเภท
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ช่องทาง
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                จำนวนเงิน (บาท)
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                ดำเนินการ
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {/* map จาก 'filteredTransactions' */}
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{t.date}</div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{t.description}</div>
                  {/* แสดงโน๊ตถ้ามี */}
                  {t.note && (
                    <div className="text-xs text-gray-500 mt-1">
                      (โน๊ต: {t.note})
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderTypeBadge(t.type)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {renderPaymentMethod(t.paymentMethod)}
                </td>
                
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                  t.type === 'Income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {t.type === 'Expense' ? '-' : ''}
                  {formatNumber(t.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-indigo-600 hover:text-indigo-900 mr-4 transition duration-300">
                    แก้ไข
                  </button>
                  <button className="text-red-600 hover:text-red-900 transition duration-300">
                    ลบ
                  </button>
                </td>
              </tr>
            ))}
            
            {/* แสดงผลเมื่อไม่พบข้อมูลที่กรอง */}
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500">
                  ไม่พบรายการในช่วงวันที่ที่เลือก
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Money;