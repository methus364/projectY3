import React, { useState, useMemo } from 'react'; // (เพิ่ม useMemo)

// --- ข้อมูลสมมติ (Mock Data) ---
const mockRepairRequests = [
  { id: 1, date: '2025-11-10', room: '101', tenantName: 'สมชาย ใจดี', issue: 'แอร์ไม่เย็น', status: 'Pending' },
  { id: 2, date: '2025-11-09', room: '205', tenantName: 'สมหญิง จริงใจ', issue: 'น้ำรั่วซึมที่อ่างล้างหน้า', status: 'In Progress' },
  { id: 3, date: '2025-11-08', room: '302', tenantName: 'วิชัย รักสงบ', issue: 'หลอดไฟในห้องน้ำขาด', status: 'Completed' },
  { id: 4, date: '2025-11-10', room: '104', tenantName: 'อารี สุขใจ', issue: 'ประตูตู้เสื้อผ้าปิดไม่สนิท', status: 'Pending' },
];
// ---------------------------------

// --- ฟังก์ชันสำหรับแสดงป้ายสถานะการซ่อม ---
const renderStatusBadge = (status) => {
  // ... (โค้ดเหมือนเดิม)
  switch (status) {
    case 'Pending':
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">รอตรวจสอบ</span>;
    case 'In Progress':
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">กำลังดำเนินการ</span>;
    case 'Completed':
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">เสร็จสิ้น</span>;
    default:
      return <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
  }
};
// ---------------------------------


const Repair = () => {
  const [requests, setRequests] = useState(mockRepairRequests);

  // --- (ใหม่) State สำหรับตัวกรองวันที่ ---
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });

  // --- (ใหม่) ฟังก์ชันอัปเดต State ช่วงวันที่ ---
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- (ใหม่) กรองรายการตาม "ช่วงวันที่" ---
  const filteredRequests = useMemo(() => {
    const { startDate, endDate } = dateRange;
    if (!startDate && !endDate) return requests;

    return requests.filter((req) => {
      const reqDate = req.date;
      if (startDate && !endDate) return reqDate >= startDate;
      if (!startDate && endDate) return reqDate <= endDate;
      return reqDate >= startDate && reqDate <= endDate;
    });
  }, [requests, dateRange]);
  // ---------------------------------

  return (
    <>
      <div className="flex w-full flex-col bg-white p-6"> 
        
        {/* --- (อัปเดต) ส่วนหัว: เพิ่มตัวกรองวันที่ --- */}
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            รายงานการแจ้งซ่อม
          </h1>
          
          {/* ส่วนควบคุม (ตัวกรองวันที่) */}
          <div className="flex flex-wrap items-center space-x-3">
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
          </div>
        </div>

        {/* --- ตารางแสดงรายการ --- */}
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่แจ้ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้อง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ผู้แจ้ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการที่แจ้ง</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {/* --- (อัปเดต) map จาก 'filteredRequests' --- */}
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-700">{req.date}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{req.room}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm text-gray-700">{req.tenantName}</div></td>
                  <td className="px-6 py-4"><div className="text-sm text-gray-900 max-w-xs truncate">{req.issue}</div></td>
                  <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(req.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-4 transition duration-300">ดูรายละเอียด</button>
                    <button className="text-green-600 hover:text-green-900 transition duration-300">อัปเดตสถานะ</button>
                  </td>
                </tr>
              ))}
              
              {/* --- (อัปเดต) ข้อความเมื่อไม่พบข้อมูล --- */}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-gray-500">
                    ไม่พบรายการแจ้งซ่อมในช่วงวันที่ที่เลือก
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

      </div>
    </>
  )
}   

export default Repair