import React, { useState } from 'react';

const initialCustomers = [
  { id: 1, name: 'สมชาย ใจดี', phone: '0812345678', email: 'somchai@example.com', status: 'active' },
  { id: 2, name: 'สาวิตรี สวยงาม', phone: '0898765432', email: 'sawitree@example.com', status: 'inactive' },
  { id: 3, name: 'อนุชา เก่งมาก', phone: '0865432109', email: 'anucha@example.com', status: 'active' },
  { id: 4, name: 'จันทร์จิรา สดใส', phone: '0823456789', email: 'janjira@example.com', status: 'active' },
  { id: 5, name: 'ธนวัฒน์ กล้าหาญ', phone: '0876543210', email: 'tanawat@example.com', status: 'inactive' },
];

const Customers = () => {
  const [customers, setCustomers] = useState(initialCustomers);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ id: null, name: '', phone: '', email: '', status: 'active' });

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setForm({ id: null, name: '', phone: '', email: '', status: 'active' });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.id) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === form.id ? { ...form } : c))
      );
    } else {
      setCustomers((prev) => [
        ...prev,
        { ...form, id: prev.length ? prev[prev.length - 1].id + 1 : 1 },
      ]);
    }
    setShowModal(false);
  };

  const openEditModal = (customer) => {
    setForm(customer);
    setShowModal(true);
  };

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 flex-shrink-0">รายการลูกค้า</h1>

      <div className="flex flex-wrap gap-4 mb-4 flex-shrink-0">
        <input
          type="text"
          placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร, หรืออีเมล"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-4 py-2 flex-grow min-w-[200px]"
        />
        <button
          onClick={openAddModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded flex-shrink-0"
        >
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      {/* ตารางเลื่อน */}
      <div className="flex-grow overflow-auto border border-gray-300 rounded">
        <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
          <thead className="bg-gray-200 sticky top-0 z-10">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-left">ชื่อ</th>
              <th className="border border-gray-300 px-4 py-2 text-left">เบอร์โทร</th>
              <th className="border border-gray-300 px-4 py-2 text-left">อีเมล</th>
              <th className="border border-gray-300 px-4 py-2 text-left">สถานะ</th>
              <th className="border border-gray-300 px-4 py-2 text-center">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-gray-100 cursor-pointer"
                >
                  <td className="border border-gray-300 px-4 py-2">{customer.name}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.phone}</td>
                  <td className="border border-gray-300 px-4 py-2">{customer.email}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {customer.status === 'active' ? (
                      <span className="text-green-600 font-semibold">Active</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactive</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    <button
                      onClick={() => openEditModal(customer)}
                      className="bg-yellow-400 hover:bg-yellow-500 px-3 py-1 rounded text-white"
                    >
                      แก้ไข
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  ไม่พบข้อมูลลูกค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal เพิ่ม/แก้ไขลูกค้า */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full"
          >
            <h2 className="text-xl font-bold mb-4">
              {form.id ? 'แก้ไขลูกค้า' : 'เพิ่มลูกค้าใหม่'}
            </h2>

            <label className="block mb-2">
              ชื่อ
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block mb-2">
              เบอร์โทร
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block mb-2">
              อีเมล
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full border rounded px-3 py-2 mt-1"
              />
            </label>

            <label className="block mb-4">
              สถานะ
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 mt-1"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
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

export default Customers;
