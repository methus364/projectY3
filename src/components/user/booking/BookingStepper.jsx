import React from 'react';

// แถบแสดงความคืบหน้าการจอง (สไตล์ Agoda) — บอกว่าตอนนี้อยู่สเต็ปไหน
// props:
//   steps       = อาเรย์ชื่อสเต็ป เช่น ['ค้นหา', 'เลือกห้อง', ...]
//   currentStep = เลขสเต็ปปัจจุบัน (เริ่มที่ 1)
export default function BookingStepper({ steps, currentStep }) {
  return (
    <div className="flex items-start justify-between mb-6 px-1">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const isLast = index === steps.length - 1;

        // สีวงกลม: ทำแล้ว/กำลังทำ = ฟ้า, ยังไม่ถึง = เทา
        const circleClass = isDone || isActive
          ? 'bg-[#5A2D82] text-white'
          : 'bg-[#E2E8F0] text-[#94A3B8]';

        return (
          <div key={label} className="flex-1 flex flex-col items-center relative">
            {/* เส้นเชื่อมระหว่างสเต็ป (ไม่วาดหลังวงสุดท้าย) */}
            {!isLast && (
              <div
                className={`absolute top-4 left-1/2 w-full h-0.5 ${isDone ? 'bg-[#5A2D82]' : 'bg-[#CBD5E1]'}`}
              />
            )}
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${circleClass}`}>
              {isDone ? '✓' : stepNumber}
            </div>
            <span className={`mt-1.5 text-xs font-bold text-center ${isActive ? 'text-[#5A2D82]' : 'text-[#94A3B8]'}`}>
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
