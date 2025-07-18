import React, { useState, useEffect } from 'react';

const initialRooms = [
  { id: 1, name: '101', available: true, floor: 1, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 1', image: null },
  { id: 2, name: '102', available: true, floor: 1, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 1', image: null },
  { id: 3, name: '103', available: false, floor: 1, type: 'รายวัน', description: 'ห้องมีผู้พักแล้ว ชั้น 1', image: null },
  { id: 4, name: '104', available: true, floor: 1, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 1', image: null },
  { id: 5, name: '105', available: true, floor: 1, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 1', image: null },

  { id: 6, name: '201', available: false, floor: 2, type: 'รายเดือน', description: 'ห้องมีผู้พักแล้ว ชั้น 2', image: null },
  { id: 7, name: '202', available: true, floor: 2, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 2', image: null },
  { id: 8, name: '203', available: true, floor: 2, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 2', image: null },
  { id: 9, name: '204', available: false, floor: 2, type: 'รายวัน', description: 'ห้องมีผู้พักแล้ว ชั้น 2', image: null },
  { id: 10, name: '205', available: true, floor: 2, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 2', image: null },

  { id: 11, name: '301', available: true, floor: 3, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 3', image: null },
  { id: 12, name: '302', available: false, floor: 3, type: 'รายเดือน', description: 'ห้องอยู่ระหว่างซ่อม ชั้น 3', image: null },
  { id: 13, name: '303', available: true, floor: 3, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 3', image: null },
  { id: 14, name: '304', available: true, floor: 3, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 3', image: null },
  { id: 15, name: '305', available: false, floor: 3, type: 'รายเดือน', description: 'ห้องมีผู้พักแล้ว ชั้น 3', image: null },

  { id: 16, name: '401', available: true, floor: 4, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 4', image: null },
  { id: 17, name: '402', available: true, floor: 4, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 4', image: null },
  { id: 18, name: '403', available: false, floor: 4, type: 'รายวัน', description: 'ห้องถูกจองแล้ว ชั้น 4', image: null },
  { id: 19, name: '404', available: true, floor: 4, type: 'รายวัน', description: 'ห้องรายวัน ชั้น 4', image: null },
  { id: 20, name: '405', available: true, floor: 4, type: 'รายเดือน', description: 'ห้องรายเดือน ชั้น 4', image: null },
];

const Rooms = () => {
  const [rooms, setRooms] = useState(initialRooms);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedType, setSelectedType] = useState('ทั้งหมด');
  const [showAddEditModal, setShowAddEditModal] = useState(false);

  const [form, setForm] = useState({
    id: null,
    name: '',
    floor: 1,
    type: 'รายเดือน',
    available: true,
    description: '',
    image: null,
  });

  // โหลดข้อมูลห้องลงฟอร์มตอน Edit
  useEffect(() => {
    if (selectedRoom) {
      setForm({
        id: selectedRoom.id,
        name: selectedRoom.name,
        floor: selectedRoom.floor,
        type: selectedRoom.type,
        available: selectedRoom.available,
        description: selectedRoom.description,
        image: selectedRoom.image,
      });
    }
  }, [selectedRoom]);

  const closeModal = () => {
    setSelectedRoom(null);
    setShowAddEditModal(false);
    setForm({
      id: null,
      name: '',
      floor: 1,
      type: 'รายเดือน',
      available: true,
      description: '',
      image: null,
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'file') {
      if (files && files[0]) {
        setForm((prev) => ({ ...prev, image: URL.createObjectURL(files[0]) }));
      } else {
        setForm((prev) => ({ ...prev, image: null }));
      }
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSaveRoom = (e) => {
    e.preventDefault();
    if (form.id) {
      // แก้ไขข้อมูล
      setRooms((prevRooms) =>
        prevRooms.map((room) =>
          room.id === form.id
            ? {
                ...room,
                name: form.name,
                floor: Number(form.floor),
                type: form.type,
                available: form.available,
                description: form.description,
                image: form.image,
              }
            : room
        )
      );
    } else {
      // เพิ่มข้อมูลใหม่
      const newRoom = {
        id: rooms.length + 1,
        name: form.name,
        floor: Number(form.floor),
        type: form.type,
        available: form.available,
        description: form.description,
        image: form.image,
      };
      setRooms((prev) => [...prev, newRoom]);
    }
    closeModal();
  };

  // กรองห้องตามชั้นและประเภท
  const filteredRooms = rooms.filter(
    (room) =>
      room.floor === selectedFloor &&
      (selectedType === 'ทั้งหมด' || room.type === selectedType)
  );

  return (
    <div className="p-4">

      {/* ตัวเลือกชั้นและประเภท */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">เลือกชั้น:</label>
          <select
            className="px-4 py-2 rounded border border-gray-300"
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(Number(e.target.value))}
          >
            {[1, 2, 3, 4].map((floor) => (
              <option key={floor} value={floor}>
                ชั้น {floor}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-2 text-lg font-medium text-gray-700">เลือกประเภท:</label>
          <select
            className="px-4 py-2 rounded border border-gray-300"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="ทั้งหมด">ทั้งหมด</option>
            <option value="รายวัน">รายวัน</option>
            <option value="รายเดือน">รายเดือน</option>
          </select>
        </div>
        <div>
          {/* ปุ่มเพิ่มข้อมูลห้อง */}
          <button
            className="mb-6 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded shadow"
            onClick={() => {
              setForm({
                id: null,
                name: '',
                floor: 1,
                type: 'รายเดือน',
                available: true,
                description: '',
                image: null,
              });
              setShowAddEditModal(true);
            }}
          >
            เพิ่มข้อมูลห้อง
          </button>
        </div>
      </div>

      {/* แสดงรายชื่อห้อง */}
      <div className="grid grid-cols-5 gap-4">
        {filteredRooms.map((room) => (
          <div key={room.id} className="relative">
            <button
              className={`rounded-lg px-4 py-2 shadow-md text-white font-semibold w-full ${
                room.available ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 cursor-not-allowed'
              }`}
              disabled={!room.available}
              onClick={() => setSelectedRoom(room)}
            >
              ห้อง {room.name}
            </button>
          </div>
        ))}
        {filteredRooms.length === 0 && (
          <div className="col-span-5 text-center text-gray-500 font-medium">
            ไม่มีห้องที่ตรงกับตัวเลือก
          </div>
        )}
      </div>

      {/* Popup แสดงข้อมูลห้อง */}
      {selectedRoom && !showAddEditModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-2xl w-80 relative">
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              ข้อมูลห้อง {selectedRoom.name}
            </h2>
            <p className="text-gray-700 mb-2">{selectedRoom.description}</p>
            <p className="text-sm text-gray-600 mb-4">
              ประเภท: {selectedRoom.type} | ชั้น {selectedRoom.floor} |{' '}
              {selectedRoom.available ? 'ว่าง' : 'ไม่ว่าง'}
            </p>
            {selectedRoom.image && (
              <img
                src={selectedRoom.image}
                alt={`ห้อง ${selectedRoom.name}`}
                className="w-full h-40 object-cover rounded mb-4"
              />
            )}
            <div className="flex justify-between">
              <button
                className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded"
                onClick={() => {
                  setShowAddEditModal(true);
                }}
              >
                แก้ไข
              </button>
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={() => setSelectedRoom(null)}
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ฟอร์มเพิ่ม/แก้ไขห้อง */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 overflow-auto p-4">
          <form
            onSubmit={handleSaveRoom}
            className="bg-white/90 backdrop-blur-md p-6 rounded-xl shadow-2xl w-full max-w-md relative"
          >
            <h2 className="text-2xl font-bold mb-4">
              {form.id ? `แก้ไขข้อมูลห้อง ${form.name}` : 'เพิ่มข้อมูลห้อง'}
            </h2>

            <label className="block mb-2 font-semibold">
              ชื่อห้อง
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded mt-1"
              />
            </label>

            <label className="block mb-2 font-semibold">
              ชั้น
              <select
                name="floor"
                value={form.floor}
                onChange={handleChange}
                className="w-full p-2 border rounded mt-1"
              >
                {[1, 2, 3, 4].map((floor) => (
                  <option key={floor} value={floor}>
                    ชั้น {floor}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-2 font-semibold">
              ประเภท
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="รายเดือน">รายเดือน</option>
                <option value="รายวัน">รายวัน</option>
              </select>
            </label>

            <label className="block mb-2 font-semibold flex items-center">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
                className="mr-2"
              />
              ว่าง
            </label>

            <label className="block mb-4 font-semibold">
              รายละเอียด
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                className="w-full p-2 border rounded mt-1"
              />
            </label>

            <label className="block mb-4 font-semibold">
              รูปภาพ
              <input type="file" name="image" onChange={handleChange} accept="image/*" />
            </label>

            {form.image && typeof form.image === 'string' && (
              <img src={form.image} alt="preview" className="mb-4 w-full h-40 object-cover rounded" />
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                บันทึก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Rooms;
