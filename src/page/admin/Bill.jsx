import React from 'react'
import BillNavbar from '../../components/admin/BillNavbar'; // <-- Import Navbar
const Bill = () => {
  return (
    <>
        <BillNavbar />
        <div className="flex h-screen w-full flex-col bg-gray-100 p-4">
            <h1 className="text-2xl font-semibold mb-4">Bill Management</h1>
            <p className="text-gray-600">This is the bill management section.</p>
            {/* Add your bill management content here */}
        </div> 
    </>
  )
}

export default Bill
