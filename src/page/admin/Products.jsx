import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
};

const Products = () => {
    // แท็บ: 'products' = จัดการสินค้า, 'sales' = ประวัติการขาย
    const [tab, setTab] = useState('products');

    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // modal เพิ่ม/แก้ไขสินค้า — ถ้า editing มีค่าคือกำลังแก้ไข
    const [showProductModal, setShowProductModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [productForm, setProductForm] = useState({ product_name: '', price: '', stock: '' });

    // modal ขายสินค้า
    const [sellProduct, setSellProduct] = useState(null);
    const [sellForm, setSellForm] = useState({ quantity: '1', member_id: '' });

    const [saving, setSaving] = useState(false);

    // ==========================================
    // โหลดข้อมูล
    // ==========================================
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/products`, getAuthHeader());
            if (res.data.success) setProducts(res.data.data);
        } catch (err) {
            console.error('โหลดสินค้าไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${API}/sales`, getAuthHeader());
            if (res.data.success) setSales(res.data.data);
        } catch (err) {
            console.error('โหลดประวัติการขายไม่สำเร็จ:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API}/members`, getAuthHeader());
            if (res.data.success) setMembers(res.data.data);
        } catch (err) {
            console.error('โหลดสมาชิกไม่สำเร็จ:', err);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchMembers();
    }, []);

    // โหลดประวัติการขายเมื่อเปิดแท็บนั้น
    useEffect(() => {
        if (tab === 'sales') fetchSales();
    }, [tab]);

    // ==========================================
    // เพิ่ม/แก้ไขสินค้า
    // ==========================================
    const openAddProduct = () => {
        setEditing(null);
        setProductForm({ product_name: '', price: '', stock: '' });
        setShowProductModal(true);
    };

    const openEditProduct = (product) => {
        setEditing(product);
        setProductForm({
            product_name: product.product_name,
            price: String(product.price),
            stock: String(product.stock),
        });
        setShowProductModal(true);
    };

    const closeProductModal = () => {
        setShowProductModal(false);
        setEditing(null);
    };

    const handleSaveProduct = async () => {
        const name = productForm.product_name.trim();
        const price = parseFloat(productForm.price);
        const stock = parseInt(productForm.stock, 10);

        if (!name || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
            alert('กรุณากรอกชื่อสินค้า ราคา และจำนวนคงเหลือให้ถูกต้อง (ไม่ติดลบ)');
            return;
        }

        try {
            setSaving(true);
            const body = { product_name: name, price, stock };
            if (editing) {
                await axios.put(`${API}/products/${editing.product_id}`, body, getAuthHeader());
            } else {
                await axios.post(`${API}/products`, body, getAuthHeader());
            }
            closeProductModal();
            fetchProducts();
        } catch (err) {
            console.error('บันทึกสินค้าไม่สำเร็จ:', err);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการบันทึกสินค้า');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (product) => {
        if (!window.confirm(`ต้องการลบสินค้า "${product.product_name}" ใช่หรือไม่?`)) return;
        try {
            await axios.delete(`${API}/products/${product.product_id}`, getAuthHeader());
            fetchProducts();
        } catch (err) {
            console.error('ลบสินค้าไม่สำเร็จ:', err);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบสินค้า');
        }
    };

    // ==========================================
    // ขายสินค้า
    // ==========================================
    const openSell = (product) => {
        setSellProduct(product);
        setSellForm({ quantity: '1', member_id: '' });
    };

    const closeSell = () => setSellProduct(null);

    const handleSell = async () => {
        const quantity = parseInt(sellForm.quantity, 10);
        if (isNaN(quantity) || quantity <= 0) {
            alert('กรุณากรอกจำนวนที่ขายมากกว่า 0');
            return;
        }
        if (quantity > sellProduct.stock) {
            alert(`สินค้าคงเหลือไม่พอ (เหลือ ${sellProduct.stock} ชิ้น)`);
            return;
        }

        try {
            setSaving(true);
            await axios.post(
                `${API}/sale`,
                {
                    product_id: sellProduct.product_id,
                    quantity,
                    member_id: sellForm.member_id || null,
                },
                getAuthHeader()
            );
            closeSell();
            fetchProducts(); // refresh stock
        } catch (err) {
            console.error('บันทึกการขายไม่สำเร็จ:', err);
            alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการขายสินค้า');
        } finally {
            setSaving(false);
        }
    };

    // helper แสดงเงิน
    const fmtMoney = (val) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <>
            <div className="flex w-full flex-col bg-white p-6">

                {/* ส่วนหัว + แท็บ */}
                <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">ขายของหอพัก</h1>
                    {tab === 'products' && (
                        <button
                            onClick={openAddProduct}
                            className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                        >
                            + เพิ่มสินค้า
                        </button>
                    )}
                </div>

                {/* แท็บสลับ สินค้า / ประวัติการขาย */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setTab('products')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                            tab === 'products' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        สินค้า
                    </button>
                    <button
                        onClick={() => setTab('sales')}
                        className={`px-4 py-2 text-sm rounded-lg transition ${
                            tab === 'sales' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        ประวัติการขาย
                    </button>
                </div>

                {/* ตารางสินค้า */}
                {tab === 'products' && (
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">สินค้า</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">ราคา (บ.)</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">คงเหลือ</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">ดำเนินการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {products.map((p) => (
                                        <tr key={p.product_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{p.product_name}</td>
                                            <td className="px-4 py-3 text-right text-gray-700">{fmtMoney(p.price)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={p.stock === 0 ? 'text-red-500 font-semibold' : 'text-gray-800'}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                                                <button
                                                    onClick={() => openSell(p)}
                                                    disabled={p.stock === 0}
                                                    className="text-sm font-medium text-green-600 hover:text-green-900 disabled:text-gray-300"
                                                >
                                                    ขาย
                                                </button>
                                                <button
                                                    onClick={() => openEditProduct(p)}
                                                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                                                >
                                                    แก้ไข
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(p)}
                                                    className="text-sm font-medium text-red-600 hover:text-red-900"
                                                >
                                                    ลบ
                                                </button>
                                            </td>
                                        </tr>
                                    ))}

                                    {products.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="text-center py-10 text-gray-500">ยังไม่มีสินค้า</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* ตารางประวัติการขาย */}
                {tab === 'sales' && (
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                        {loading ? (
                            <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">สินค้า</th>
                                        <th className="px-4 py-3 text-center font-medium text-gray-500 uppercase tracking-wider">จำนวน</th>
                                        <th className="px-4 py-3 text-right font-medium text-gray-500 uppercase tracking-wider">รวม (บ.)</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ผู้ซื้อ</th>
                                        <th className="px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">ผู้บันทึก</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {sales.map((s) => (
                                        <tr key={s.sale_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                {new Date(s.sale_date).toLocaleString('th-TH')}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-900">{s.product_name}</td>
                                            <td className="px-4 py-3 text-center text-gray-700">{s.quantity}</td>
                                            <td className="px-4 py-3 text-right text-green-600 font-medium">{fmtMoney(s.total_price)}</td>
                                            <td className="px-4 py-3 text-gray-500">{s.buyer_name || 'ลูกค้าทั่วไป'}</td>
                                            <td className="px-4 py-3 text-gray-500">{s.seller_name || '—'}</td>
                                        </tr>
                                    ))}

                                    {sales.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center py-10 text-gray-500">ยังไม่มีประวัติการขาย</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>

            {/* Modal เพิ่ม/แก้ไขสินค้า */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-5">
                            {editing ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}
                        </h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
                            <input
                                type="text"
                                value={productForm.product_name}
                                onChange={(e) => setProductForm(prev => ({ ...prev, product_name: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="เช่น น้ำดื่ม, บะหมี่กึ่งสำเร็จรูป"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (บาท)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={productForm.price}
                                onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="กรอกราคา"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนคงเหลือ</label>
                            <input
                                type="number"
                                min="0"
                                value={productForm.stock}
                                onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="กรอกจำนวน"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeProductModal}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSaveProduct}
                                disabled={saving}
                                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal ขายสินค้า */}
            {sellProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-xl font-bold text-gray-800 mb-1">ขายสินค้า</h2>
                        <p className="text-sm text-gray-500 mb-5">
                            {sellProduct.product_name} · ราคา {fmtMoney(sellProduct.price)} บ./ชิ้น · คงเหลือ {sellProduct.stock}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนที่ขาย</label>
                            <input
                                type="number"
                                min="1"
                                max={sellProduct.stock}
                                value={sellForm.quantity}
                                onChange={(e) => setSellForm(prev => ({ ...prev, quantity: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">ผู้ซื้อ (ถ้ามี)</label>
                            <select
                                value={sellForm.member_id}
                                onChange={(e) => setSellForm(prev => ({ ...prev, member_id: e.target.value }))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="">ลูกค้าทั่วไป (ไม่ระบุ)</option>
                                {members.map((m) => (
                                    <option key={m.member_id} value={m.member_id}>{m.full_name}</option>
                                ))}
                            </select>
                        </div>

                        {/* ยอดรวมที่จะต้องจ่าย (คำนวณคร่าวๆ ฝั่ง client เพื่อแสดงเฉยๆ — server คำนวณจริง) */}
                        <p className="text-sm text-gray-700 mb-6">
                            ยอดรวม: <span className="font-semibold text-green-600">
                                {fmtMoney((parseInt(sellForm.quantity, 10) || 0) * Number(sellProduct.price))}
                            </span> บาท
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={closeSell}
                                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleSell}
                                disabled={saving}
                                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                            >
                                {saving ? 'กำลังบันทึก...' : 'ยืนยันการขาย'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Products;
