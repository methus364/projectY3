import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AdminRoute, PrivateRoute } from './ProtectedRoute';
import Home from "../page/user/Home";
import Login from "../page/user/Login";
import Rooms from "../page/admin/Rooms";
import Massage from "../page/admin/Massage";
import Products from "../page/admin/Products";
import Customer from "../page/admin/Customer";
import Bill from "../page/admin/Bill";
import Booking from "../page/admin/Booking";
import Repair from "../page/admin/Repair";
import Register from "../page/user/Register";
import Dashbord from "../page/admin/Dashbord";
import LayoutAdmin from "../layouts/LayoutAdmin";
import Roomuser from "../page/user/Roomuser";
import Roomhistory from "../page/user/Roomhistory";
import Profile from "../page/user/Profile";
import Editprofile from "../page/user/Editprofile";
import Contact from "../page/user/Contact";
import Money from "../page/admin/Money";
import Bookingmanagement from "../page/admin/Bookingmanagement";
import RepairRequest from "../page/user/RepairRequest";
import MyBills from "../page/user/MyBills";
import LineCallback from "../page/user/LineCallback";
import Contracts from "../page/admin/Contracts";
import AuditLogs from "../page/admin/AuditLogs";

// รวม Router สำหรับเปลี่ยนไปหน้าต่างๆ
const router = createBrowserRouter([
  {
    // router ฝั่ง admin — ต้องเป็น Admin เท่านั้น (AdminRoute กัน tenant เข้าไม่ได้)
    path: "/admin",
    element: <AdminRoute><LayoutAdmin /></AdminRoute>,
    children: [
      { index: true, element: <Dashbord /> },
      { path: "rooms", element: <Rooms /> },
      { path: "products", element: <Products /> },
      { path: "customers", element: <Customer /> },
      { path: "bill", element: <Bill /> },
      { path: "contracts", element: <Contracts /> },
      { path: "audit-logs", element: <AuditLogs /> },
      { path: "massage", element: <Massage /> },
      { path: "booking", element: <Booking /> },
      { path: "repair", element: <Repair /> },
      { path: "money", element: <Money /> },
      { path: "bookingmanagement", element: <Bookingmanagement /> },
    ],
  },
  // router ฝั่ง user
  {
    path: "/",
    children: [
      // หน้าสาธารณะ — เข้าได้ทุกคน
      { index: true, element: <Home /> },
      { path: "home", element: <Home /> },
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "contact", element: <Contact /> },
      { path: "roomuser", element: <Roomuser /> },
      { path: "auth/line/callback", element: <LineCallback /> },
      // หน้าส่วนตัว — ต้อง login (PrivateRoute redirect ไป /login ถ้ายังไม่มี token)
      { path: "roomhistory", element: <PrivateRoute><Roomhistory /></PrivateRoute> },
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
      { path: "Editprofile", element: <PrivateRoute><Editprofile /></PrivateRoute> },
      { path: "repairrequest", element: <PrivateRoute><RepairRequest /></PrivateRoute> },
      { path: "mybills", element: <PrivateRoute><MyBills /></PrivateRoute> },
    ],
  },
]);

const AppRouter = () => {
  return (
    <div>
      <RouterProvider router={router} />
    </div>
  );
};

export default AppRouter;
